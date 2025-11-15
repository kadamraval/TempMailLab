
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
import { Skeleton } from "./ui/skeleton";
import { useFirestore, useUser, useAuth, errorEmitter, FirestorePermissionError } from "@/firebase";
import { getDocs, query, collection, where, addDoc, serverTimestamp, getDoc, doc, orderBy, limit } from "firebase/firestore";
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

export function DashboardClient() {
  const [currentInbox, setCurrentInbox] = useState<{ emailAddress: string; expiresAt: number } | null>(null);
  const [inboxEmails, setInboxEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isGenerating, setIsGenerating] = useState(true); // Start in generating state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [userPlan, setUserPlan] = useState<Plan | null>(null);
  const [arePlansLoading, setArePlansLoading] = useState(true);

  const firestore = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // --- Start of Plan Fetching Logic ---
  useEffect(() => {
    async function fetchPlan() {
        if (isUserLoading || !firestore) return;

        setArePlansLoading(true);
        try {
            let fetchedPlan: Plan | null = null;
            
            if (user && !user.isAnonymous) {
                const userDoc = await getDoc(doc(firestore, 'users', user.uid));
                if (userDoc.exists() && userDoc.data().planId) {
                    const planId = userDoc.data().planId;
                    const planDoc = await getDoc(doc(firestore, 'plans', planId));
                    if (planDoc.exists()) {
                         fetchedPlan = { id: planDoc.id, ...planDoc.data() } as Plan;
                    }
                }
            }

            // Fallback for guests or if user plan not found
            if (!fetchedPlan) {
                const freePlanQuery = query(collection(firestore, "plans"), where("name", "==", "Free"), limit(1));
                const freePlanSnap = await getDocs(freePlanQuery);
                
                if (!freePlanSnap.empty) {
                    const planDoc = freePlanSnap.docs[0];
                    fetchedPlan = { id: planDoc.id, ...planDoc.data() } as Plan;
                } else {
                    const defaultPlanRef = doc(firestore, "plans", "default");
                    const defaultPlanDoc = await getDoc(defaultPlanRef);
                    if (defaultPlanDoc.exists()) {
                        fetchedPlan = { id: defaultPlanDoc.id, ...defaultPlanDoc.data() } as Plan;
                    } else {
                         toast({
                            title: "Configuration Error",
                            description: "No default or free subscription plans are configured. Please contact support.",
                            variant: "destructive",
                        });
                    }
                }
            }
            
            setUserPlan(fetchedPlan);

        } catch (error: any) {
            console.error("Failed to fetch plan:", error);
            if (error.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'plans', operation: 'list' }));
            } else {
                toast({
                    title: "Error Loading Configuration",
                    description: "Could not load subscription details. Please try again later.",
                    variant: "destructive",
                });
            }
        } finally {
            setArePlansLoading(false);
        }
    }
    fetchPlan();
  }, [user, isUserLoading, firestore, toast]);
  // --- End of Plan Fetching Logic ---
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
        let sid = localStorage.getItem('tempinbox_session_id');
        if (!sid) {
            sid = generateRandomString(20);
            localStorage.setItem('tempinbox_session_id', sid);
        }
        sessionIdRef.current = sid;
    }
  }, []);

  const ensureAnonymousUser = useCallback(async () => {
    if (!auth) return false;
    if (auth.currentUser) return true;
    try {
        await signInAnonymously(auth);
        return true;
    } catch (error) {
        console.error("Anonymous sign-in failed:", error);
        toast({ title: "Error", description: "Could not create a secure session.", variant: "destructive"});
        return false;
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
    if (!isAutoRefresh) {
        setIsRefreshing(true);
    }
    
    // Ensure user exists before fetching, which may lead to a write
    ensureAnonymousUser();

    try {
        const result = await fetchEmailsFromServerAction(sessionIdRef.current, currentInbox.emailAddress);
        if (result.error) {
          throw new Error(result.error);
        }
        
        if (result.emails && result.emails.length > 0) {
            const hasNewEmails = result.emails.some(newEmail => !inboxEmails.some(existing => existing.id === newEmail.id));

            if (hasNewEmails) {

                setInboxEmails(prevEmails => {
                    const existingIds = new Set(prevEmails.map(e => e.id));
                    const newEmails = result.emails!.filter(e => !existingIds.has(e.id));
                    
                    if (newEmails.length > 0) {
                        toast({ title: "New Email Arrived!", description: `You received ${newEmails.length} new message(s).` });
                    } else if (!isAutoRefresh) {
                        toast({ title: "Inbox refreshed", description: "No new emails found." });
                    }
    
                    const allEmails = [...prevEmails, ...newEmails];
                    return allEmails.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
                });
            } else if (!isAutoRefresh) {
                toast({ title: "Inbox refreshed", description: "No new emails found." });
            }
        } else {
            if (!isAutoRefresh) {
                toast({ title: "Inbox refreshed", description: "No new emails found." });
            }
        }
    } catch (error: any)
    {
        console.error("Error fetching emails:", error);
        if (!isAutoRefresh) {
            toast({ title: "Refresh Failed", description: error.message || "Could not refresh inbox.", variant: "destructive" });
        }
    } finally {
        if (!isAutoRefresh) {
            setIsRefreshing(false);
        }
    }
  }, [currentInbox, toast, ensureAnonymousUser, inboxEmails]);


  const handleGenerateEmail = useCallback(async (isInitialLoad = false) => {
    if (!isInitialLoad && isGenerating) return;

    if (arePlansLoading || !userPlan) {
        if (!isInitialLoad) {
          toast({
            title: "Configuration not loaded",
            description: "Plans are still loading, please try again in a moment.",
            variant: "destructive",
          });
        }
        return;
    }
    
    setIsGenerating(true);

    // This is a key user action, ensure anonymous user exists.
    ensureAnonymousUser();

    try {
      const domainsQuery = query(
        collection(firestore, "allowed_domains"),
        where("tier", "in", userPlan.features.allowPremiumDomains ? ["free", "premium"] : ["free"])
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
        expiresAt: Date.now() + userPlan.features.inboxLifetime * 60 * 1000,
      };

      setCurrentInbox(newInbox);
      setSelectedEmail(null);
      setInboxEmails([]);

      handleRefresh(true);

    } catch (error: any) {
       if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: 'allowed_domains',
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
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
    }
  }, [arePlansLoading, userPlan, firestore, toast, ensureAnonymousUser, isGenerating, handleRefresh]);
  
  useEffect(() => {
    if (!arePlansLoading && !currentInbox) {
        handleGenerateEmail(true);
    }
  }, [arePlansLoading, currentInbox, handleGenerateEmail]);

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
    // This is a key user action, ensure anonymous user exists.
    ensureAnonymousUser();
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
    setCurrentInbox(null);
    setInboxEmails([]);
    setSelectedEmail(null);
    toast({
        title: "Inbox Cleared",
        description: "A new address can be generated.",
    });
    handleGenerateEmail(false);
  };

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

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

          <div className="flex-grow flex items-center justify-center">
            {isGenerating || !currentInbox ? (
                 <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Generating address...</span>
                </div>
            ) : (
              <>
                <p className="font-mono text-lg text-foreground">{currentInbox.emailAddress}</p>
                <Button onClick={handleCopyEmail} variant="ghost" size="icon" className="ml-2">
                  <Copy className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
          
          <Button onClick={() => handleGenerateEmail(false)} variant="outline" disabled={isGenerating || arePlansLoading}>
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
