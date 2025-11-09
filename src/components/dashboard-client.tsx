
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Copy, RefreshCw, Loader2, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { type Email } from "@/types";
import { InboxView } from "./inbox-view";
import { EmailView } from "./email-view";
import { Skeleton } from "./ui/skeleton";
import { cn } from "@/lib/utils";
import { useFirestore } from "@/firebase";
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
                const newEmails = result.emails.filter(e => !existingIds.has(e.id));
                
                if (newEmails.length > 0) {
                    toast({ title: "New Email Arrived!", description: `You received ${newEmails.length} new message(s).` });
                } else if (!isAutoRefresh) {
                    toast({ title: "Inbox refreshed", description: "No new emails found." });
                }

                // Combine and sort, ensuring no duplicates
                const allEmails = [...prevEmails, ...newEmails];
                const uniqueEmails = Array.from(new Map(allEmails.map(email => [email.id, email])).values());
                return uniqueEmails.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
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

    const userTier = 'free';

    setIsLoading(true);
    setSelectedEmail(null);
    setInboxEmails([]);
    setActiveInbox(null);
    clearCountdown();
    clearRefreshInterval();

    try {
      const allowedDomainsQuery = query(collection(firestore, "allowed_domains"), where("tier", "==", userTier));
      const querySnapshot = await getDocs(allowedDomainsQuery);
      
      if (querySnapshot.empty) {
        throw new Error(`No domains configured by the administrator for the '${userTier}' tier.`);
      }

      const allowedDomains = querySnapshot.docs.map(doc => doc.data().domain);
      const randomDomain = allowedDomains[Math.floor(Math.random() * allowedDomains.length)];
      const emailAddress = `${generateRandomString(12)}@${randomDomain}`;
      
      setActiveInbox({ emailAddress });
      setCountdown(600);
      
      // Initial fetch is manual
      await handleRefresh(false); 
      
      // Start auto-refreshing
      refreshIntervalRef.current = setInterval(() => handleRefresh(true), 15000); // every 15 seconds

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
  }, [firestore, toast, handleRefresh]);

  useEffect(() => {
    sessionIdRef.current = getSessionId();
    handleGenerateEmail();
    
    // Cleanup on unmount
    return () => {
        clearCountdown();
        clearRefreshInterval();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount


  useEffect(() => {
    if (activeInbox && countdown > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown <= 0 && activeInbox) {
        toast({
            title: "Session Expired",
            description: "Your temporary email has expired. Please generate a new one.",
            variant: "destructive"
        })
      setActiveInbox(null);
      clearRefreshInterval();
      clearCountdown();
    }
    return () => clearCountdown();
  }, [activeInbox, countdown, toast]);

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

  if (isLoading && !activeInbox) {
      return (
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
              <Loader2 className="h-8 w-8 animate-spin" />
          </div>
      )
  }

  if (selectedEmail) {
    return <EmailView email={selectedEmail} onBack={handleBackToInbox} />;
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <CardTitle>Your Temporary Email Address</CardTitle>
            {!activeInbox ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating...</span>
                </div>
            ) : (
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-md">
                    <Clock className="h-4 w-4" />
                    <span>Expires in: {formatTime(countdown)}</span>
                </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!activeInbox ? (
            <div className="flex items-center space-x-2">
              <Skeleton className="h-10 flex-grow" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <Input
                readOnly
                value={activeInbox?.emailAddress || "Generating..."}
                className="text-lg text-center sm:text-left font-mono"
              />
              <div className="flex gap-2 w-full sm:w-auto">
                <Button onClick={handleCopyEmail} variant="outline" className="w-full sm:w-auto">
                  <Copy className="mr-2 h-4 w-4" /> Copy
                </Button>
                 <Button onClick={() => handleRefresh(false)} variant="outline" className="w-full sm:w-auto" disabled={isRefreshing || !activeInbox}>
                    <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
                    Refresh
                </Button>
                <Button onClick={handleGenerateEmail} className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90">
                   New Email
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Inbox</CardTitle>
          <Button onClick={handleDeleteInbox} variant="ghost" size="sm" disabled={!inboxEmails || inboxEmails.length === 0}>
            <Trash2 className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">Clear Inbox</span>
          </Button>
        </CardHeader>
        <CardContent>
          <InboxView inbox={inboxEmails} onSelectEmail={handleSelectEmail} />
        </CardContent>
      </Card>
    </div>
  );
}
