
"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from 'next/link';
import { Copy, RefreshCw, Loader2, Clock, Trash2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { type Email } from "@/types";
import { InboxView } from "./inbox-view";
import { EmailView } from "./email-view";
import { Skeleton } from "./ui/skeleton";
import { useFirestore, useUser, useAuth, useCollection, useDoc, useMemoFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import { getDocs, query, collection, where, addDoc, serverTimestamp, getDoc, doc } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { fetchEmailsFromServerAction } from "@/lib/actions/mailgun";
import { type Plan } from "@/app/(admin)/admin/packages/data";

function generateRandomString(length: number) {
  let result = '';
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export function DashboardClient() {
  const [activeInboxes, setActiveInboxes] = useState<any[]>([]);
  const [currentInbox, setCurrentInbox] = useState<any | null>(null);
  const [inboxEmails, setInboxEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(0); 
  const firestore = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // --- Start of Plan Fetching Logic ---
  const defaultPlanRef = useMemoFirebase(() => firestore ? doc(firestore, 'plans', 'default') : null, [firestore]);
  const { data: defaultPlan, isLoading: isDefaultPlanLoading } = useDoc<Plan>(defaultPlanRef);

  const userPlanRef = useMemoFirebase(() => {
      if (!firestore || !user || user.isAnonymous) return null;
      // This needs to be more dynamic based on the user's actual plan
      const userPlanId = (user as any).planId || 'default';
      return doc(firestore, 'plans', userPlanId); 
  }, [firestore, user]);
  const { data: userPlanData, isLoading: isUserPlanLoading } = useDoc<Plan>(userPlanRef);

  const userPlan = useMemo(() => {
      if (user && !user.isAnonymous && userPlanData) {
          return userPlanData;
      }
      return defaultPlan;
  }, [user, userPlanData, defaultPlan]);
  
  const arePlansLoading = isUserLoading || isDefaultPlanLoading || (!!user && !user.isAnonymous && isUserPlanLoading);
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
        toast({ title: "Secure Session Created", description: "Your anonymous session has started." });
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

    try {
        const result = await fetchEmailsFromServerAction(sessionIdRef.current, currentInbox.emailAddress);
        if (result.error) {
          throw new Error(result.error);
        }
        
        if (result.emails && result.emails.length > 0) {
            const hasNewEmails = result.emails.some(newEmail => !inboxEmails.some(existing => existing.id === newEmail.id));

            if (hasNewEmails) {
                // This is the first time we've seen emails, create the user
                if(inboxEmails.length === 0) {
                    await ensureAnonymousUser();
                }

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


  const handleGenerateEmail = useCallback(async () => {
    if (!firestore || !auth || isGenerating || arePlansLoading) {
      toast({ title: "Error", description: "Application is not ready. Please try again in a moment.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);

    try {
        // Only ensure user exists if they are generating a *new* address after the first one
        if (currentInbox || activeInboxes.length > 0) {
           const userExists = await ensureAnonymousUser();
           if (!userExists) {
                setIsGenerating(false);
                return;
           }
        }
        
        if (!userPlan) {
            throw new Error("Could not determine a subscription plan. Please try again.");
        }

        // Check inbox limit only if a user exists
        if (auth.currentUser && activeInboxes.length >= userPlan.features.maxInboxes) {
            toast({
                title: "Inbox Limit Reached",
                description: `Your plan allows for ${userPlan.features.maxInboxes} active inbox(es).`,
                variant: "destructive"
            });
            setIsGenerating(false);
            return;
        }

        setSelectedEmail(null);
        setInboxEmails([]);
        setCurrentInbox(null);
        clearCountdown();
        clearRefreshInterval();

        const userTier = (user && !user.isAnonymous && userPlan.features.allowPremiumDomains) ? 'premium' : 'free';
        const domainsQuery = query(collection(firestore, "allowed_domains"), where("tier", "==", userTier));
        const domainsSnapshot = await getDocs(domainsQuery);
        
        let allowedDomains = domainsSnapshot.docs.map(doc => doc.data().domain);

        if (allowedDomains.length === 0) {
            const freeDomainsQuery = query(collection(firestore, "allowed_domains"), where("tier", "==", "free"));
            const freeSnapshot = await getDocs(freeDomainsQuery);
            allowedDomains = freeSnapshot.docs.map(doc => doc.data().domain);
            if (freeSnapshot.empty) {
              throw new Error(`No domains configured by the administrator.`);
            }
        }

        const randomDomain = allowedDomains[Math.floor(Math.random() * allowedDomains.length)];
        const emailAddress = `${generateRandomString(12)}@${randomDomain}`;
        
        const newInbox = { 
            emailAddress,
            expiresAt: Date.now() + (userPlan.features.inboxLifetime * 60 * 1000) 
        };
        
        setCurrentInbox(newInbox);
        setActiveInboxes(prev => [...prev, newInbox]);
        setCountdown(userPlan.features.inboxLifetime * 60);
        
        if (sessionIdRef.current && emailAddress) {
            const result = await fetchEmailsFromServerAction(sessionIdRef.current, emailAddress);
            if (result.emails && result.emails.length > 0) {
                setInboxEmails(result.emails);
                // If emails are found immediately, create the anonymous user
                ensureAnonymousUser();
            }
        }
        
        refreshIntervalRef.current = setInterval(() => handleRefresh(true), 15000); 

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
      setIsGenerating(false)
    }
  }, [firestore, auth, user, toast, userPlan, activeInboxes, isGenerating, handleRefresh, currentInbox, ensureAnonymousUser, arePlansLoading]);
  
  useEffect(() => {
    if (currentInbox) {
        clearCountdown(); // Clear any existing timer
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
                setActiveInboxes(prev => prev.filter(inbox => inbox.emailAddress !== currentInbox.emailAddress));
                clearRefreshInterval();
                clearCountdown();
            } else {
                setCountdown(newCountdown);
            }
        }, 1000);
    }
    return () => clearCountdown();
  }, [currentInbox, toast]);

  const handleCopyEmail = async () => {
    if (!currentInbox?.emailAddress) return;
    await ensureAnonymousUser();
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
    setInboxEmails([]);
    toast({
        title: "Inbox Cleared",
        description: "Messages cleared successfully.",
    });
  };

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (arePlansLoading) {
     return (
        <Card className="min-h-[480px] flex flex-col">
            <CardHeader className="border-b p-4 text-center">
                 <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                     <Skeleton className="h-8 w-24 rounded-md" />
                     <Skeleton className="h-6 w-64 rounded-md" />
                     <Skeleton className="h-10 w-36 rounded-md" />
                 </div>
            </CardHeader>
            <CardContent className="p-6 flex-grow flex flex-col items-center justify-center text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground mt-4">Loading components...</p>
            </CardContent>
        </Card>
     )
  }

  if (selectedEmail) {
    return <EmailView email={selectedEmail} onBack={handleBackToInbox} />;
  }

  if (!currentInbox) {
     return (
        <Card className="min-h-[480px] flex flex-col">
            <CardHeader className="border-b p-4 text-center">
                 <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                     <div className="flex items-center gap-2 text-sm font-mono bg-secondary px-3 py-1.5 rounded-md text-muted-foreground invisible">
                        <Clock className="h-4 w-4" />
                        <span>00:00</span>
                    </div>
                    <p className="text-muted-foreground">Your temporary inbox will appear here</p>
                    <Button onClick={handleGenerateEmail} variant="outline" disabled={isGenerating || arePlansLoading}>
                        {(isGenerating || arePlansLoading) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        New Address
                    </Button>
                 </div>
            </CardHeader>
            <CardContent className="p-6 flex-grow flex flex-col items-center justify-center text-center">
                 <div className="flex flex-col items-center gap-4 text-muted-foreground">
                    <ShieldAlert className="h-16 w-16 text-primary/50" />
                    <h3 className="text-2xl font-semibold tracking-tight text-foreground">Protect Your Privacy</h3>
                    <p className="max-w-md">
                        Click the &quot;New Address&quot; button to generate a free, disposable email address. Keep your real inbox safe from spam and phishing attempts.
                    </p>
                </div>
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
        </Card>
     )
  }

  return (
    <Card>
        <CardHeader className="border-b p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm font-mono bg-secondary px-3 py-1.5 rounded-md text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{formatTime(countdown)}</span>
                </div>

                <div className="flex-grow flex items-center justify-center">
                    <p className="font-mono text-lg text-foreground">{currentInbox?.emailAddress}</p>
                     <Button onClick={handleCopyEmail} variant="ghost" size="icon" className="ml-2">
                        <Copy className="h-5 w-5" />
                    </Button>
                </div>
                
                <Button onClick={handleGenerateEmail} variant="outline" disabled={isGenerating || arePlansLoading}>
                   {(isGenerating || arePlansLoading) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
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
        {user && user.isAnonymous && !userPlan?.features.noAds && (
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

    