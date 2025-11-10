
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from 'next/link';
import { Copy, RefreshCw, Loader2, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { type Email } from "@/types";
import { InboxView } from "./inbox-view";
import { EmailView } from "./email-view";
import { Skeleton } from "./ui/skeleton";
import { useFirestore, useUser } from "@/firebase";
import { getDocs, query, collection, where } from "firebase/firestore";
import { fetchEmailsFromServerAction } from "@/lib/actions/mailgun";

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

export function DashboardClient() {
  const [activeInbox, setActiveInbox] = useState<{ emailAddress: string } | null>(null);
  const [inboxEmails, setInboxEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(600); // 10 minutes
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | null>(null);

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
    if (!activeInbox?.emailAddress || !sessionIdRef.current) return;
    if (!isAutoRefresh) {
        setIsRefreshing(true);
    }

    try {
        const result = await fetchEmailsFromServerAction(sessionIdRef.current, activeInbox.emailAddress);
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
  }, [activeInbox, toast]);


  const handleGenerateEmail = useCallback(async () => {
    if (!firestore) {
      toast({ title: "Error", description: "Application is not ready.", variant: "destructive" });
      return;
    }

    const userTier = user && !user.isAnonymous ? 'premium' : 'free';

    setIsLoading(true);
    setSelectedEmail(null);
    setInboxEmails([]);
    setActiveInbox(null);
    clearCountdown();
    clearRefreshInterval();

    try {
      const allowedDomainsQuery = query(collection(firestore, "allowed_domains"), where("tier", "==", userTier));
      const querySnapshot = await getDocs(allowedDomainsQuery);
      
      let allowedDomains = querySnapshot.docs.map(doc => doc.data().domain);

      if (allowedDomains.length === 0) {
        // Fallback to 'free' tier if no premium domains are set
        const freeDomainsQuery = query(collection(firestore, "allowed_domains"), where("tier", "==", "free"));
        const freeSnapshot = await getDocs(freeDomainsQuery);
        allowedDomains = freeSnapshot.docs.map(doc => doc.data().domain);
        if (freeSnapshot.empty) {
          throw new Error(`No domains configured by the administrator.`);
        }
      }

      const randomDomain = allowedDomains[Math.floor(Math.random() * allowedDomains.length)];
      const emailAddress = `${generateRandomString(12)}@${randomDomain}`;
      
      setActiveInbox({ emailAddress });
      setCountdown(600);
      
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
  }, [firestore, toast, user, handleRefresh]);

  useEffect(() => {
    sessionIdRef.current = getSessionId();
    handleGenerateEmail();
    
    return () => {
        clearCountdown();
        clearRefreshInterval();
    }
  }, [handleGenerateEmail]); 


  useEffect(() => {
    if (activeInbox) {
      if (countdown <= 0) {
        toast({
            title: "Session Expired",
            description: "Your temporary email has expired. Please generate a new one.",
            variant: "destructive"
        });
        setActiveInbox(null);
        clearRefreshInterval();
        clearCountdown();
        return;
      }
      
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearCountdown();
  }, [activeInbox, toast]);

  const handleCopyEmail = () => {
    if (!activeInbox?.emailAddress) return;
    navigator.clipboard.writeText(activeInbox.emailAddress);
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

  if (selectedEmail) {
    return <EmailView email={selectedEmail} onBack={handleBackToInbox} />;
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Your Temporary Inbox</h2>
      </div>

      <Card className="shadow-lg">
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
                      <p className="font-mono text-lg text-foreground">{activeInbox?.emailAddress}</p>
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
          {user && user.isAnonymous && (
             <CardFooter className="p-4 border-t bg-secondary">
                  <p className="text-center text-sm text-muted-foreground w-full">
                      <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
                          Log In
                      </Link>
                      {' '}for more features like custom domains & longer inbox life.
                  </p>
             </CardFooter>
          )}
      </Card>
    </div>
  );
}

    
