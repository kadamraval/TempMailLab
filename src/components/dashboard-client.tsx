
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Copy, RefreshCw, Loader2, Clock, Trash2, Inbox, ServerCrash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { type Email, type Inbox as InboxType } from "@/types";
import { EmailView } from "@/components/email-view";
import { useAuth, useFirestore, useUser, useMemoFirebase, useDoc, useCollection } from "@/firebase";
import { getDocs, query, collection, where, doc, addDoc, serverTimestamp, deleteDoc, updateDoc, writeBatch } from "firebase/firestore";
import { fetchEmailsWithCredentialsAction } from "@/lib/actions/mailgun";
import { type Plan } from "@/app/(admin)/admin/packages/data";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { signInAnonymously } from "firebase/auth";

const EnvelopeLoader = () => (
    <div className="relative w-20 h-20">
        <svg className="w-full h-full" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 25 L40 50 L70 25 L70 60 H10 V25Z" stroke="currentColor" strokeWidth="3" className="text-muted-foreground/50"/>
            <rect x="18" y="30" width="44" height="0" fill="hsl(var(--primary))" className="animate-[expand_1.5s_ease-out_infinite]" style={{ animationDelay: '0.2s' }}/>
            <path d="M10 25 L40 50 L70 25" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
            <path d="M10 60 L40 35 L70 60" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
        <style jsx>{`
            @keyframes expand {
                0% { height: 0; y: 30; opacity: 0; }
                40% { height: 20px; y: 10px; opacity: 1; }
                80% { height: 20px; y: 10px; opacity: 1; }
                100% { height: 0; y: 30; opacity: 0; }
            }
        `}</style>
    </div>
);

function generateRandomString(length: number) {
  let result = '';
  const characters = 'abcdefghijklmnopqrstuvwxyz012349';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

const LOCAL_INBOX_ID_KEY = 'tempinbox_anonymous_inbox_id';


export function DashboardClient() {
  const [currentInbox, setCurrentInbox] = useState<InboxType | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);

  const firestore = useFirestore();
  const { user, isUserLoading, userProfile } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Determine plan from user profile, or default to 'free-default'
  const planId = userProfile?.planId || 'free-default';
  const userPlanRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'plans', planId);
  }, [firestore, planId]);

  const { data: activePlan, isLoading: isLoadingPlan } = useDoc<Plan>(userPlanRef);

  // Fetch the inbox for the current user (registered or anonymous)
  const userInboxQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || isUserLoading) return null;
     // For registered users, query by their UID. For anonymous, this won't run until we have an inbox from local storage
    if (user && !user.isAnonymous) {
        return query(
            collection(firestore, `inboxes`),
            where("userId", "==", user.uid),
            where("expiresAt", ">", new Date().toISOString())
        );
    }
    return null;
  }, [firestore, user, isUserLoading]);

  const { data: userInboxes, isLoading: isLoadingInboxes } = useCollection<InboxType>(userInboxQuery);

  const inboxRef = useMemoFirebase(() => {
      if(!firestore || !currentInbox) return null;
      return doc(firestore, 'inboxes', currentInbox.id)
  }, [firestore, currentInbox]);

  const { data: liveInbox, isLoading: isLoadingLiveInbox } = useDoc<InboxType>(inboxRef);
  
  const emailsQuery = useMemoFirebase(() => {
    if (!firestore || !currentInbox?.id) return null;
    return query(collection(firestore, `inboxes/${currentInbox.id}/emails`));
  }, [firestore, currentInbox]);

  const { data: inboxEmails, isLoading: isLoadingEmails } = useCollection<Email>(emailsQuery);
  
  // This function is now used for ALL users, anonymous or not.
  const handleGenerateNewInbox = useCallback(async (plan: Plan, userId: string) => {
    if (!firestore) return;
    setIsGenerating(true);
    setServerError(null);

    // Delete old inbox if one exists
    if(currentInbox) {
        await deleteDoc(doc(firestore, "inboxes", currentInbox.id));
    }
    setCurrentInbox(null);
    setSelectedEmail(null);

    try {
        const domainsQuery = query(
            collection(firestore, "allowed_domains"),
            where("tier", "in", plan.features.allowPremiumDomains ? ["free", "premium"] : ["free"])
        );
        const domainsSnapshot = await getDocs(domainsQuery);
        const allowedDomains = domainsSnapshot.docs.map((doc) => doc.data().domain as string);

        if (domainsSnapshot.empty) throw new Error("No domains configured by the administrator.");
        
        const randomDomain = allowedDomains[Math.floor(Math.random() * allowedDomains.length)];
        const emailAddress = `${generateRandomString(12)}@${randomDomain}`;
        
        const newInboxData = {
            userId: userId,
            emailAddress,
            createdAt: serverTimestamp(),
            expiresAt: new Date(Date.now() + (plan.features.inboxLifetime || 10) * 60 * 1000).toISOString(),
        };

        const newInboxRef = await addDoc(collection(firestore, `inboxes`), newInboxData);
        
        // If the user is anonymous, store the new inbox ID in localStorage.
        if (user && user.isAnonymous) {
            localStorage.setItem(LOCAL_INBOX_ID_KEY, newInboxRef.id);
        }
        
        // Set the new inbox as the current one.
        setCurrentInbox({
            ...newInboxData,
            id: newInboxRef.id,
            createdAt: new Date().toISOString(),
        });
        

    } catch (error: any) {
        console.error("Error generating new inbox:", error);
        toast({
            title: "Error",
            description: error.message || "Could not generate a new email address.",
            variant: "destructive",
        });
    } finally {
        setIsGenerating(false);
    }
  }, [firestore, toast, user, currentInbox]);

  const handleRefresh = useCallback(async (isAutoRefresh = false) => {
    if (!currentInbox?.emailAddress || !currentInbox.id) return;
    
    if (!isAutoRefresh) setIsRefreshing(true);
    
    try {
      const result = await fetchEmailsWithCredentialsAction(
          currentInbox.emailAddress,
          currentInbox.id,
      );
        
      if (result.error) {
        const errorMsg = result.error || "An unexpected error occurred while fetching emails.";
        setServerError(errorMsg);
        if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current); 
        if (!isAutoRefresh) toast({ title: 'Refresh Failed', description: errorMsg, variant: 'destructive'});
      } else {
        setServerError(null);
      }
    } catch (error: any) {
        if (!isAutoRefresh) toast({ title: "Refresh Failed", description: error.message || "An unknown error occurred while fetching emails.", variant: "destructive" });
        console.error("Error refreshing inbox:", error.message);
    } finally {
        if (!isAutoRefresh) setIsRefreshing(false);
    }
  }, [currentInbox, toast]);


  // Effect for initial auth and inbox setup
  useEffect(() => {
    if (isUserLoading || isLoadingPlan) {
        return;
    }

    if (!activePlan) {
        return;
    }

    // 1. Ensure we have a user (sign in anonymously if needed)
    if (!user && auth) {
        signInAnonymously(auth).catch((error) => {
            console.error("Anonymous sign-in failed", error);
            setServerError("Could not establish a session. Please refresh the page.");
        });
        return; // Wait for user object to be created
    }

    if (!user) return; // Still waiting for user

    // 2. Handle registered user
    if (!user.isAnonymous) {
        localStorage.removeItem(LOCAL_INBOX_ID_KEY); // Clean up old anonymous data
        if (!isLoadingInboxes) {
            if (userInboxes && userInboxes.length > 0) {
                 if (!currentInbox || currentInbox.id !== userInboxes[0].id) {
                    setCurrentInbox(userInboxes[0]);
                }
            } else if (!isGenerating) {
                handleGenerateNewInbox(activePlan, user.uid);
            }
        }
        return;
    }

    // 3. Handle anonymous user
    if (user.isAnonymous) {
        const localInboxId = localStorage.getItem(LOCAL_INBOX_ID_KEY);
        if (localInboxId) {
            if (!currentInbox || currentInbox.id !== localInboxId) {
                // We have an ID, fetch the doc from firestore
                const anonyInboxRef = doc(firestore, 'inboxes', localInboxId);
                getDoc(anonyInboxRef).then(docSnap => {
                    if (docSnap.exists()) {
                        const inboxData = docSnap.data() as InboxType;
                        if (new Date(inboxData.expiresAt) > new Date()) {
                            setCurrentInbox({ id: docSnap.id, ...inboxData });
                        } else {
                            // Inbox expired, generate a new one
                            handleGenerateNewInbox(activePlan, user.uid);
                        }
                    } else {
                        // ID in local storage is invalid, generate new inbox
                        handleGenerateNewInbox(activePlan, user.uid);
                    }
                })
            }
        } else if (!isGenerating) {
            // No local inbox ID, generate a new one
            handleGenerateNewInbox(activePlan, user.uid);
        }
    }
  }, [user, isUserLoading, activePlan, isLoadingPlan, auth, isLoadingInboxes, userInboxes, isGenerating, handleGenerateNewInbox]);


  // Effect for countdown timer and auto-refresh
  useEffect(() => {
    const clearTimers = () => {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };

    clearTimers();

    if (liveInbox?.expiresAt) {
        const expiryDate = new Date(liveInbox.expiresAt);
        const updateCountdown = () => {
            const newCountdown = Math.floor((expiryDate.getTime() - Date.now()) / 1000);
            if (newCountdown <= 0) {
                toast({ title: "Session Expired", description: "Your temporary email has expired.", variant: "destructive"});
                if (activePlan && user) {
                    handleGenerateNewInbox(activePlan, user.uid);
                }
            } else {
                setCountdown(newCountdown);
            }
        };
        updateCountdown();
        countdownIntervalRef.current = setInterval(updateCountdown, 1000);
        
        handleRefresh(true);
        refreshIntervalRef.current = setInterval(() => handleRefresh(true), 15000);

    } else if(currentInbox?.expiresAt) {
         // Fallback for initial load before liveInbox is available
        const expiryDate = new Date(currentInbox.expiresAt);
        const newCountdown = Math.floor((expiryDate.getTime() - Date.now()) / 1000);
        setCountdown(newCountdown > 0 ? newCountdown : 0);
    }
    
    return clearTimers;
  }, [liveInbox, currentInbox, handleRefresh, handleGenerateNewInbox, activePlan, user, toast]);


  const handleCopyEmail = () => {
    if (!currentInbox?.emailAddress) return;
    navigator.clipboard.writeText(currentInbox.emailAddress);
    toast({ title: "Copied!", description: "Email address copied to clipboard." });
  };

  const handleDeleteCurrentInbox = () => {
      if (activePlan && user) {
          handleGenerateNewInbox(activePlan, user.uid);
      }
  }

  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email);
  };
  
  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };
  
  const isLoading = isUserLoading || isLoadingPlan || (user && !user.isAnonymous && isLoadingInboxes);

  if (isLoading && !currentInbox) { 
    return (
        <div className="flex items-center justify-center min-h-[480px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }
  
  if (!activePlan && !isLoadingPlan) {
    return (
       <div className="flex items-center justify-center min-h-[480px]">
         <Alert variant="destructive" className="max-w-lg">
            <ServerCrash className="h-4 w-4" />
            <AlertTitle>Server Configuration Error</AlertTitle>
            <AlertDescription>
                A default 'free-default' plan is required for the application to function. An administrator must create one in the admin dashboard.
            </AlertDescription>
          </Alert>
       </div>
    )
  }

  return (
     <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between gap-4 p-2 border bg-card text-card-foreground rounded-lg">
        <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{formatTime(countdown)}</span>
        </div>
        
        <div 
          onClick={handleCopyEmail}
          className="flex-grow flex items-center justify-center font-mono text-base md:text-lg text-foreground bg-muted hover:bg-secondary cursor-pointer p-2 rounded-md transition-colors group"
        >
          {isGenerating || !currentInbox ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating...</span>
            </div>
          ) : (
            <>
              <span className="truncate">{currentInbox.emailAddress}</span>
              <Copy className="h-4 w-4 ml-2 text-muted-foreground group-hover:text-foreground transition-colors" />
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => handleRefresh(false)} variant="outline" size="sm" disabled={isRefreshing}>
            {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
          <Button onClick={handleDeleteCurrentInbox} variant="outline" size="sm" className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

       {serverError && (
          <Alert variant="destructive">
            <ServerCrash className="h-4 w-4" />
            <AlertTitle>Server Configuration Error</AlertTitle>
            <AlertDescription>
                {serverError} Email refreshing is disabled.
            </AlertDescription>
          </Alert>
        )}

      <div className="flex-1">
        <Card className="h-full">
            <CardContent className="p-0 h-full">
                <div className="grid grid-cols-1 md:grid-cols-[350px_1fr] h-full min-h-[calc(100vh-400px)]">
                <div className="flex flex-col border-r">
                    <ScrollArea className="flex-1">
                    {(isLoadingEmails || isLoadingLiveInbox || (isLoading && !currentInbox)) && (!inboxEmails || inboxEmails.length === 0) ? (
                        <div className="flex-grow flex flex-col items-center justify-center text-center py-12 px-4 text-muted-foreground space-y-4 h-full">
                            <EnvelopeLoader />
                            <p className="mt-4 text-lg">Waiting for incoming emails...</p>
                            <p className="text-sm">New messages will appear here automatically.</p>
                        </div>
                    ) : (
                        <div className="p-2 space-y-1">
                        {(inboxEmails || []).map(email => (
                            <button
                            key={email.id}
                            onClick={() => handleSelectEmail(email)}
                            className={cn(
                                "w-full text-left p-3 rounded-md border-b border-transparent transition-colors flex items-center gap-4",
                                selectedEmail?.id === email.id ? 'bg-muted' : 'hover:bg-muted/50',
                                !email.read && "font-semibold bg-card"
                            )}
                            >
                                <div className={cn("h-2 w-2 rounded-full shrink-0", !email.read ? 'bg-primary' : 'bg-transparent')}></div>
                                <div className="flex-grow overflow-hidden">
                                  <div className="truncate font-medium">{email.senderName}</div>
                                  <div className={cn("truncate text-sm", !email.read ? 'text-foreground' : 'text-muted-foreground')}>{email.subject}</div>
                                </div>
                            </button>
                        ))}
                        </div>
                    )}
                    </ScrollArea>
                </div>
                <div className="col-span-1 hidden md:block">
                    {selectedEmail ? (
                    <EmailView email={selectedEmail} plan={activePlan} onBack={() => setSelectedEmail(null)} showBackButton={false} />
                    ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground bg-card">
                        <Inbox className="h-16 w-16 mb-4" />
                        <h3 className="text-xl font-semibold">Select an email to read</h3>
                        <p>Your messages will appear here.</p>
                    </div>
                    )}
                </div>
                {selectedEmail && (
                    <div className="md:hidden absolute inset-0 bg-background z-10">
                    <EmailView email={selectedEmail} plan={activePlan} onBack={() => setSelectedEmail(null)} showBackButton={true} />
                    </div>
                )}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

    