"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from 'next/link';
import { Copy, RefreshCw, Loader2, Clock, Trash2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { type Email } from "@/types";
import { InboxView } from "./inbox-view";
import { EmailView } from "./email-view";
import { Skeleton } from "./ui/skeleton";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { getDocs, query, collection, where, addDoc, serverTimestamp, getDoc, doc } from "firebase/firestore";
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

function getSessionId() {
    if (typeof window === 'undefined') return null;
    let sessionId = localStorage.getItem('tempinbox_session_id');
    if (!sessionId) {
        sessionId = generateRandomString(20);
        localStorage.setItem('tempinbox_session_id', sessionId);
    }
    return sessionId;
}

interface DashboardClientProps {
    userPlan?: Plan | null;
}

export function DashboardClient({ userPlan: initialPlan }: DashboardClientProps) {
  const [activeInboxes, setActiveInboxes] = useState<any[]>([]);
  const [currentInbox, setCurrentInbox] = useState<any | null>(null);
  const [inboxEmails, setInboxEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(600); 
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Fetch all plans to determine premium status
  const plansQuery = useMemoFirebase(() => firestore ? collection(firestore, "plans") : null, [firestore]);
  const { data: allPlans, isLoading: isLoadingPlans } = useCollection<Plan>(plansQuery);

  const userPlan = useMemo(() => {
    if (initialPlan) return initialPlan; // Use plan passed via props if available (for anonymous)
    if (isLoadingPlans || !allPlans || !user) return null;
    // This is a placeholder for real subscription logic
    if (user && !user.isAnonymous) {
      return allPlans.find(p => p.name.toLowerCase() === 'premium') || allPlans.find(p => p.name.toLowerCase() === 'default');
    }
    return allPlans.find(p => p.name.toLowerCase() === 'default');
  }, [initialPlan, allPlans, user, isLoadingPlans]);
  
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
  }, [currentInbox, toast]);


  const handleGenerateEmail = useCallback(async () => {
    if (!firestore || !userPlan) {
      toast({ title: "Error", description: "Application is not ready.", variant: "destructive" });
      return;
    }

    if (activeInboxes.length >= userPlan.features.maxInboxes) {
        toast({
            title: "Inbox Limit Reached",
            description: `Your plan allows for ${userPlan.features.maxInboxes} active inbox(es).`,
            variant: "destructive"
        });
        return;
    }


    setIsLoading(true);
    setSelectedEmail(null);
    setInboxEmails([]);
    setCurrentInbox(null);
    clearCountdown();
    clearRefreshInterval();

    try {
      const userTier = userPlan.features.allowPremiumDomains ? 'premium' : 'free';
      const allowedDomainsQuery = query(collection(firestore, "allowed_domains"), where("tier", "==", userTier));
      const querySnapshot = await getDocs(allowedDomainsQuery);
      
      let allowedDomains = querySnapshot.docs.map(doc => doc.data().domain);

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
          if (result.emails) {
              setInboxEmails(result.emails);
          }
      }
      
      refreshIntervalRef.current = setInterval(() => handleRefresh(true), 15000); 

    } catch (error: any) {
      console.error("Error generating new inbox:", error);
      toast({
        title: "Error",
        description: error.message || "Could not generate a new email address.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [firestore, toast, user, handleRefresh, userPlan, activeInboxes]);

  useEffect(() => {
    sessionIdRef.current = getSessionId();
    if (userPlan) {
        handleGenerateEmail();
    }
    
    return () => {
        clearCountdown();
        clearRefreshInterval();
    }
  }, [userPlan]); // Re-run when plan is loaded


  useEffect(() => {
    if (currentInbox) {
      if (countdown <= 0) {
        toast({
            title: "Session Expired",
            description: "Your temporary email has expired. Please generate a new one.",
            variant: "destructive"
        });
        setCurrentInbox(null);
        setActiveInboxes(prev => prev.filter(inbox => inbox.emailAddress !== currentInbox.emailAddress));
        clearRefreshInterval();
        clearCountdown();
        return;
      }
      
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearCountdown();
  }, [currentInbox, toast, countdown]);

  const handleCopyEmail = () => {
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

  if (!userPlan) {
     return (
      <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (selectedEmail) {
    return <EmailView email={selectedEmail} onBack={handleBackToInbox} />;
  }

  return (
    <div className="space-y-8">
      <Card>
          <CardHeader className="border-b p-4">
            {isLoading ? (
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-24 rounded-md" />
                <Skeleton className="h-10 w-1/2 rounded-md" />
                <Skeleton className="h-10 w-32 rounded-md" />
              </div>
            ) : (
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
                  
                  <Button onClick={handleGenerateEmail} variant="outline">
                     <RefreshCw className="mr-2 h-4 w-4" />
                     New Address
                  </Button>
              </div>
            )}
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
          {user && user.isAnonymous && !userPlan.features.noAds && (
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
    </div>
  );
}
