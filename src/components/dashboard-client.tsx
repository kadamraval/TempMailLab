
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Copy, RefreshCw, Loader2, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { createMailTmAccountAction, getInboxAction, getSingleEmailAction } from "@/lib/actions/mail";
import type { Email, MailTmAccount } from "@/types";
import { InboxView } from "./inbox-view";
import { EmailView } from "./email-view";
import { Skeleton } from "./ui/skeleton";
import { cn } from "@/lib/utils";
import { useUser } from "@/firebase";


export function DashboardClient() {
  const [account, setAccount] = useState<MailTmAccount | null>(null);
  const [inbox, setInbox] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(600); // 10 minutes
  const { user } = useUser();
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user) {
      handleGenerateEmail();
    } else {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const clearInboxInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const fetchInbox = useCallback(async (token: string, isManualRefresh: boolean = false) => {
    if (!token) return;
    if (isManualRefresh) setIsRefreshing(true);
    
    const fetchedMessages = await getInboxAction(token);
    setInbox(prevInbox => {
        if (JSON.stringify(prevInbox) !== JSON.stringify(fetchedMessages)) {
            return fetchedMessages;
        }
        return prevInbox;
    });
    
    if (isManualRefresh) {
        setIsRefreshing(false);
        toast({ title: "Inbox refreshed" });
    }
  }, [toast]);

  const handleGenerateEmail = useCallback(async () => {
    setIsLoading(true);
    setSelectedEmail(null);
    setInbox([]);
    clearInboxInterval();

    const newAccount = await createMailTmAccountAction();
    if (newAccount && newAccount.token) {
      setAccount(newAccount);
      setCountdown(600);
      
      fetchInbox(newAccount.token);
      intervalRef.current = setInterval(() => fetchInbox(newAccount.token!), 5000);
    } else {
      toast({
        title: "Error",
        description: "Could not generate a new email address.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  }, [toast, fetchInbox]);


  useEffect(() => {
    if (account && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (countdown === 0) {
        toast({
            title: "Session Expired",
            description: "Your temporary email has expired. Generate a new one.",
        })
      setAccount(null);
      setInbox([]);
      clearInboxInterval();
    }
  }, [account, countdown, toast]);

  const handleCopyEmail = () => {
    if (!account?.email) return;
    navigator.clipboard.writeText(account.email);
    toast({
      title: "Copied!",
      description: "Email address copied to clipboard.",
    });
  };

  const handleSelectEmail = async (email: Email) => {
    if (!account?.token) return;
    if (!email.body) {
      const fullEmail = await getSingleEmailAction(account.token, email.id.toString());
      if (fullEmail) {
        const newInbox = inbox.map((e) => (e.id === email.id ? { ...fullEmail, read: true } : e));
        setInbox(newInbox);
        setSelectedEmail({ ...fullEmail, read: true });
      } else {
        toast({ title: "Error", description: "Could not fetch email content.", variant: "destructive" });
      }
    } else {
       const newInbox = inbox.map((e) => (e.id === email.id ? { ...e, read: true } : e));
       setInbox(newInbox);
       setSelectedEmail(email);
    }
  };

  const handleBackToInbox = () => setSelectedEmail(null);

  const handleDeleteInbox = () => {
    setInbox([]);
    toast({
      title: "Inbox Cleared",
      description: "Messages cleared from view.",
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (isLoading) {
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
            {!account ? (
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
          {!account ? (
            <div className="flex items-center space-x-2">
              <Skeleton className="h-10 flex-grow" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <Input
                readOnly
                value={account?.email || "Generating..."}
                className="text-lg text-center sm:text-left font-mono"
              />
              <div className="flex gap-2 w-full sm:w-auto">
                <Button onClick={handleCopyEmail} variant="outline" className="w-full sm:w-auto">
                  <Copy className="mr-2 h-4 w-4" /> Copy
                </Button>
                 <Button onClick={() => fetchInbox(account?.token || "", true)} variant="outline" className="w-full sm:w-auto" disabled={isRefreshing || !account}>
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
          <Button onClick={handleDeleteInbox} variant="ghost" size="sm" disabled={inbox.length === 0}>
            <Trash2 className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">Clear Inbox</span>
          </Button>
        </CardHeader>
        <CardContent>
          <InboxView inbox={inbox} onSelectEmail={handleSelectEmail} />
        </CardContent>
      </Card>
    </div>
  );
}
