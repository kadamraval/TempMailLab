
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from 'next/link';
import { Copy, RefreshCw, Loader2, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { type Email } from "@/types";
import { InboxView } from "./inbox-view";
import { EmailView } from "./email-view";
import { useFirestore, useUser, useAuth, errorEmitter, FirestorePermissionError } from "@/firebase";
import { getDocs, query, collection, where, doc, getDoc } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { fetchEmailsFromServerAction } from "@/lib/actions/mailgun";
import { type Plan } from "@/app/(admin)/admin/packages/data";

function generateRandomString(length: number) {
  let result = '';
  const characters = 'abcdefghijklmnopqrstuvwxyz012349';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

interface DashboardClientProps {
  plans: Plan[];
}

export function DashboardClient({ plans }: DashboardClientProps) {
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
    
    // For anonymous users or as a fallback for logged-in users.
    // Prioritize a user-created "Free" plan. If it doesn't exist, use the system "Default" plan.
    return findPlan('Free') || findPlan('Default');
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
                toast({ title: "Configuration Error", description: "No subscription plans found. Please add a 'Free' or 'Default' plan.", variant: "destructive"});
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
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };
  
  const clearRefreshInterval = () => {
    if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
    }
  };

  const handleRefresh = useCallback(async (isAutoRefresh = false) => {
    if (!currentInbox?.emailAddress || !sessionIdRef.current) return;
    
    const currentUser = await ensureAnonymousUser();
    if (!currentUser) return;

    if (!isAutoRefresh) setIsRefreshing(true);
    
    try {
        const result = await fetchEmailsFromServerAction(sessionIdRef.current, currentInbox.emailAddress);
        if (result.error) {
            // Check for the specific server configuration error
            if (result.error.includes("FIREBASE_SERVICE_ACCOUNT")) {
                 if (!isAutoRefresh) {
                    toast({
                        title: "Server Action Required",
                        description: "Email fetching is disabled. Please configure server credentials in the admin panel.",
                        variant: "destructive",
                        duration: 10000,
                    });
                 }
                 // Stop trying to refresh if the server isn't configured
                 clearRefreshInterval();
                 return; 
            }
            throw new Error(result.error);
        }
        
        if (result.emails && result.emails.length > 0) {
            setInboxEmails(prevEmails => {
                const existingIds = new Set(prevEmails.map(e => e.id));
                const newEmails = result.emails!.filter(e => !existingIds.has(e.id));
                
                if (newEmails.length > 0) {
                    if (!isAutoRefresh) { // Only toast on manual refresh
                        toast({ title: "New Email Arrived!", description: `You received ${newEmails.length} new message(s).` });
                    }
                }
                const allEmails = [...prevEmails, ...newEmails];
                return allEmails.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
            });
        } 
        if (!isAutoRefresh && (!result.emails || result.emails.length === 0)) toast({ title: "Inbox refreshed", description: "No new emails found." });
        
    } catch (error: any) {
        console.error("Error fetching emails:", error);
        if (!isAutoRefresh) {
            toast({ title: "Refresh Failed", description: error.message || "Could not refresh inbox.", variant: "destructive" });
        }
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
                toast({
                    title: "Session Expired",
                    description: "Your temporary email has expired. Please generate a new one.",
                    variant: "destructive"
                });
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

  const handleCopyEmail = async () => {
    if (!currentInbox?.emailAddress) return;

    navigator.clipboard.writeText(currentInbox.emailAddress);
    toast({
      title: "Copied!",
      description: "Email address copied to clipboard.",
    });
  };

  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email);
    setInboxEmails(emails => emails.map(e => e.id === email.id ? {...e, read: true} : e));
  };

  const handleBackToInbox = () => setSelectedEmail(null);

  const handleDeleteInbox = async () => {
    await handleNewAddressClick();
    toast({
        title: "Inbox Cleared",
        description: "A new address has been generated.",
    });
  };

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };
  
  if (isLoading || isUserLoading) {
    return (
        <div className="flex items-center justify-center min-h-[480px] rounded-lg border bg-card">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  if (selectedEmail) {
    return <EmailView email={selectedEmail} onBack={handleBackToInbox} />;
  }

  return (
    <Card>
      <CardHeader className="border-b p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className={`flex items-center gap-2 text-sm font-mono bg-secondary px-3 py-1.5 rounded-md text-muted-foreground ${!currentInbox && "invisible"}`}>
            <Clock className="h-4 w-4" />
            <span>{formatTime(countdown)}</span>
          </div>

          <div 
            onClick={handleCopyEmail}
            className="flex-grow flex items-center justify-center font-mono text-lg text-foreground bg-muted hover:bg-secondary cursor-pointer p-2 rounded-md transition-colors group"
            >
            {isGenerating || !currentInbox ? (
                 <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Generating address...</span>
                </div>
            ) : (
              <>
                <span>{currentInbox.emailAddress}</span>
                <Copy className="h-5 w-5 ml-2 text-muted-foreground group-hover:text-foreground transition-colors" />
              </>
            )}
          </div>
          
          <Button onClick={handleNewAddressClick} variant="outline" disabled={isGenerating}>
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            New Address
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
         <InboxView 
            inbox={inboxEmails} 
            onSelectEmail={handleSelectEmail} 
            onRefresh={() => handleRefresh(false)}
            isRefreshing={isRefreshing}
            onDelete={handleDeleteInbox}
          />
      </CardContent>

      {!user && (
        <CardFooter className="p-4 border-t bg-gradient-to-r from-primary/10 to-accent/10">
          <p className="text-center text-sm text-muted-foreground w-full">
            <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
              Log In
            </Link>
            {' '}for more features like custom domains &amp; longer inbox life.
          </p>
        </CardFooter>
      )}
      {user && user.isAnonymous && (
           <CardFooter className="p-4 border-t bg-gradient-to-r from-primary/10 to-accent/10">
                <p className="text-center text-sm text-muted-foreground w-full">
                    This is a temporary anonymous session. {' '}
                    <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
                        Log In
                    </Link>
                    {' '}or{' '}
                    <Link href="/register" className="font-semibold text-primary underline-offset-4 hover:underline">
                        Sign Up
                    </Link>
                    {' '} for more features.
                </p>
           </CardFooter>
        )}
    </Card>
  );
}
