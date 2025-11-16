
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Copy, RefreshCw, Loader2, Clock, Trash2, Inbox, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { type Email } from "@/types";
import { EmailView } from "@/components/email-view";
import { useFirestore, useUser, useAuth, errorEmitter, FirestorePermissionError } from "@/firebase";
import { getDocs, query, collection, where, doc, getDoc } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { fetchEmailsFromServerAction } from "@/lib/actions/mailgun";
import { type Plan } from "@/app/(admin)/admin/packages/data";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

function generateRandomString(length: number) {
  let result = '';
  const characters = 'abcdefghijklmnopqrstuvwxyz012349';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

interface UserInboxClientProps {
  plans: Plan[];
}

export function UserInboxClient({ plans }: UserInboxClientProps) {
  const [currentInbox, setCurrentInbox] = useState<{ emailAddress: string; expiresAt: number } | null>(null);
  const [inboxEmails, setInboxEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [userPlan, setUserPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const firestore = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const findPlan = useCallback((planName: string): Plan | null => {
    return plans.find(p => p.name.toLowerCase() === planName.toLowerCase()) || null;
  }, [plans]);

  const getPlanForUser = useCallback(async (currentAuthUser: any): Promise<Plan | null> => {
    if (!firestore || plans.length === 0) return null;

    if (currentAuthUser && !currentAuthUser.isAnonymous) {
      try {
        const userDocRef = doc(firestore, 'users', currentAuthUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().planId) {
          const planId = userDoc.data().planId;
          const planDocRef = doc(firestore, 'plans', planId);
          const planDoc = await getDoc(planDocRef);
          if (planDoc.exists()) {
            return { id: planDoc.id, ...planDoc.data() } as Plan;
          }
        }
      } catch (e) {
        console.warn("Could not fetch user-specific plan, falling back.");
      }
    }
    
    return findPlan('free');
  }, [firestore, plans, findPlan]);
  
  const handleGenerateEmail = useCallback(async (plan: Plan) => {
    setIsGenerating(true);
    try {
      if (!firestore) throw new Error("Database connection not available.");

      const domainsQuery = query(
        collection(firestore, "allowed_domains"),
        where("tier", "in", plan.features.allowPremiumDomains ? ["free", "premium"] : ["free"])
      );
      const domainsSnapshot = await getDocs(domainsQuery);
      const allowedDomains = domainsSnapshot.docs.map((doc) => doc.data().domain as string);

      if (allowedDomains.length === 0) {
        throw new Error("No domains configured by the administrator.");
      }

      const randomDomain = allowedDomains[Math.floor(Math.random() * allowedDomains.length)];
      const emailAddress = `${generateRandomString(12)}@${randomDomain}`;
      
      const newInbox = {
        emailAddress,
        expiresAt: Date.now() + (plan.features.inboxLifetime || 10) * 60 * 1000,
      };

      setCurrentInbox(newInbox);
      setSelectedEmail(null);
      setInboxEmails([]);

    } catch (error: any) {
       if (error.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'allowed_domains', operation: 'list' }));
        } else {
            console.error("Error generating new inbox:", error);
            toast({
                title: "Error",
                description: error.message || "Could not generate a new email address.",
                variant: "destructive",
            });
        }
    } finally {
      setIsGenerating(false);
      setIsLoading(false);
    }
  }, [firestore, toast]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        let sid = localStorage.getItem('tempinbox_session_id');
        if (!sid) {
            sid = generateRandomString(20);
            localStorage.setItem('tempinbox_session_id', sid);
        }
        sessionIdRef.current = sid;
    }

    if (!isUserLoading && plans.length > 0 && !userPlan) {
        getPlanForUser(user).then(plan => {
             if (plan) {
                setUserPlan(plan);
                if (!currentInbox) {
                    handleGenerateEmail(plan);
                } else {
                    setIsLoading(false);
                }
            } else {
                toast({ title: "Configuration Error", description: "No subscription plans found. A system 'Free' plan is required.", variant: "destructive"});
                setIsLoading(false);
            }
        });
    }
  }, [isUserLoading, user, plans, userPlan, getPlanForUser, handleGenerateEmail, currentInbox, toast]);

  const ensureAnonymousUser = useCallback(async () => {
    if (!auth) return null;
    if (auth.currentUser) return auth.currentUser;
    try {
        const userCredential = await signInAnonymously(auth);
        return userCredential.user;
    } catch (error) {
        console.error("Anonymous sign-in failed:", error);
        toast({ title: "Error", description: "Could not create a secure session.", variant: "destructive"});
        return null;
    }
  }, [auth, toast]);

  const clearCountdown = () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  };
  
  const clearRefreshInterval = () => {
    if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
  };

  const handleRefresh = useCallback(async (isAutoRefresh = false) => {
    if (!currentInbox?.emailAddress || !sessionIdRef.current) return;
    
    const currentUser = await ensureAnonymousUser();
    if (!currentUser) return;

    if (!isAutoRefresh) setIsRefreshing(true);
    
    try {
        const result = await fetchEmailsFromServerAction(sessionIdRef.current, currentInbox.emailAddress);
        if (result.error) {
            if (result.error.includes("FIREBASE_SERVICE_ACCOUNT") && !isAutoRefresh) {
                toast({ title: "Server Action Required", description: "Email fetching is disabled.", variant: "destructive", duration: 10000 });
                clearRefreshInterval();
                return; 
            }
            throw new Error(result.error);
        }
        
        if (result.emails && result.emails.length > 0) {
            setInboxEmails(prevEmails => {
                const existingIds = new Set(prevEmails.map(e => e.id));
                const newEmails = result.emails!.filter(e => !existingIds.has(e.id));
                if (newEmails.length > 0 && !isAutoRefresh) {
                    toast({ title: "New Email Arrived!", description: `You received ${newEmails.length} new message(s).` });
                }
                const allEmails = [...prevEmails, ...newEmails];
                return allEmails.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
            });
        } 
        if (!isAutoRefresh && (!result.emails || result.emails.length === 0)) toast({ title: "Inbox refreshed", description: "No new emails found." });
        
    } catch (error: any) {
        if (!isAutoRefresh) toast({ title: "Refresh Failed", description: error.message, variant: "destructive" });
    } finally {
        if (!isAutoRefresh) setIsRefreshing(false);
    }
  }, [currentInbox, toast, ensureAnonymousUser]);

  const handleNewAddressClick = useCallback(async () => {
    if (isGenerating || !userPlan) return;
    handleGenerateEmail(userPlan);
  }, [isGenerating, userPlan, handleGenerateEmail]);

  useEffect(() => {
    clearCountdown();
    clearRefreshInterval();
    if (currentInbox) {
        setCountdown(Math.floor((currentInbox.expiresAt - Date.now()) / 1000));
        countdownIntervalRef.current = setInterval(() => {
            const newCountdown = Math.floor((currentInbox.expiresAt - Date.now()) / 1000);
            if (newCountdown <= 0) {
                toast({ title: "Session Expired", description: "Your temporary email has expired.", variant: "destructive"});
                setCurrentInbox(null);
                setInboxEmails([]);
                setSelectedEmail(null);
                clearRefreshInterval();
                clearCountdown();
            } else {
                setCountdown(newCountdown);
            }
        }, 1000);
        refreshIntervalRef.current = setInterval(() => handleRefresh(true), 15000); 
    }
    return () => {
        clearCountdown();
        clearRefreshInterval();
    };
  }, [currentInbox, toast, handleRefresh]);

  const handleCopyEmail = () => {
    if (!currentInbox?.emailAddress) return;
    navigator.clipboard.writeText(currentInbox.emailAddress);
    toast({ title: "Copied!", description: "Email address copied to clipboard." });
  };

  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email);
    setInboxEmails(emails => emails.map(e => e.id === email.id ? {...e, read: true} : e));
  };
  
  const handleDeleteInbox = async () => {
    await handleNewAddressClick();
    toast({ title: "Inbox Cleared", description: "A new address has been generated." });
  };

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };
  
  if (isLoading || isUserLoading) {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-250px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
        {/* Sub-header Bar */}
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
                <Button onClick={handleNewAddressClick} variant="outline" size="sm" disabled={isGenerating}>
                    <PlusCircle className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">New</span>
                </Button>
                <Button onClick={() => handleRefresh(false)} variant="outline" size="sm" disabled={isRefreshing}>
                    {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
                <Button onClick={handleDeleteInbox} variant="outline" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>

        {/* Two-panel Inbox Card */}
        <Card className="flex-1">
            <CardContent className="p-0 h-full">
                <div className="grid grid-cols-1 md:grid-cols-[350px_1fr] h-[calc(100vh-350px)]">
                    {/* Left Pane: Inbox List */}
                    <div className="flex flex-col border-r">
                        <ScrollArea className="flex-1">
                            {inboxEmails.length === 0 ? (
                                <div className="flex flex-col items-center justify-center text-center p-6 text-muted-foreground h-full">
                                    <Inbox className="h-10 w-10 mb-4" />
                                    <p className="font-semibold">Inbox is Empty</p>
                                    <p className="text-xs">Waiting for new emails...</p>
                                </div>
                            ) : (
                                <div className="p-2 space-y-1">
                                    {inboxEmails.map(email => (
                                        <button
                                            key={email.id}
                                            onClick={() => handleSelectEmail(email)}
                                            className={cn(
                                                "w-full text-left p-3 rounded-md border-b border-transparent text-sm transition-colors",
                                                selectedEmail?.id === email.id ? 'bg-muted' : 'hover:bg-muted/50',
                                            )}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={cn("mt-1.5 h-2 w-2 rounded-full shrink-0", !email.read ? 'bg-primary' : 'bg-transparent')}></div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className={cn("font-semibold truncate", !email.read && "text-foreground")}>{email.senderName}</p>
                                                    <p className={cn("truncate", !email.read ? "text-foreground" : "text-muted-foreground")}>{email.subject}</p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>

                    {/* Right Pane: Email View */}
                    <div className="col-span-1 hidden md:block">
                        {selectedEmail ? (
                            <EmailView email={selectedEmail} onBack={() => setSelectedEmail(null)} showBackButton={false} />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground bg-card">
                                <Inbox className="h-16 w-16 mb-4" />
                                <h3 className="text-xl font-semibold">Select an email to read</h3>
                                <p>Your messages will appear here.</p>
                            </div>
                        )}
                    </div>

                     {/* Mobile View for selected email */}
                     {selectedEmail && (
                        <div className="md:hidden absolute inset-0 bg-background z-10">
                             <EmailView email={selectedEmail} onBack={() => setSelectedEmail(null)} showBackButton={true} />
                        </div>
                     )}

                </div>
            </CardContent>
        </Card>
    </div>
  );
}

    