
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Copy, RefreshCw, Loader2, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { createMailTmAccountAction, getInboxAction, getSingleEmailAction } from "@/app/actions";
import type { Email, MailTmAccount } from "@/types";
import { InboxView } from "./inbox-view";
import { EmailView } from "./email-view";
import { Skeleton } from "./ui/skeleton";
import { cn } from "@/lib/utils";

export function TempInboxClient() {
  const [account, setAccount] = useState<MailTmAccount | null>(null);
  const [inbox, setInbox] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(600); // 10 minutes, can be adjusted
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearInboxInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const fetchInbox = useCallback(async (token: string, isManualRefresh: boolean = false) => {
    if (!token) return;
    if (isManualRefresh) {
      setIsRefreshing(true);
    }
    const fetchedMessages = await getInboxAction(token);

    // Naive check to see if new emails have arrived.
    if (fetchedMessages.length > inbox.length || isManualRefresh) {
      setInbox(fetchedMessages);
    }
    
    if (isManualRefresh) {
      setIsRefreshing(false);
      toast({ title: "Inbox refreshed" });
    }
  }, [inbox.length, toast]);

  const handleGenerateEmail = useCallback(async () => {
    setIsLoading(true);
    setSelectedEmail(null);
    setInbox([]);
    clearInboxInterval();

    const newAccount = await createMailTmAccountAction();
    if (newAccount && newAccount.token) {
      setAccount(newAccount);
      setCountdown(600);
      // Start fetching inbox for the new email
      fetchInbox(newAccount.token);
      intervalRef.current = setInterval(() => fetchInbox(newAccount.token!), 5000); // Check every 5 seconds
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
    handleGenerateEmail();
    return () => clearInboxInterval();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (account && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (countdown === 0) {
      setAccount(null);
      setInbox([]);
      clearInboxInterval();
    }
  }, [account, countdown]);

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
    // If we don't have the body, fetch it.
    if (!email.body) {
      const fullEmail = await getSingleEmailAction(account.token, email.id.toString());
      if (fullEmail) {
        setSelectedEmail(fullEmail);
        setInbox(inbox.map((e) => (e.id === email.id ? { ...fullEmail, read: true } : e)));
        return;
      } else {
        toast({ title: "Error", description: "Could not fetch email content.", variant: "destructive" });
        return;
      }
    }
    setSelectedEmail(email);
    setInbox(inbox.map((e) => (e.id === email.id ? { ...e, read: true } : e)));
  };

  const handleBackToInbox = () => setSelectedEmail(null);

  const handleDeleteInbox = () => {
    // mail.tm does not support deleting all emails at once,
    // we just clear it from the UI. A real implementation
    // would loop and delete one by one.
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

  if (selectedEmail) {
    return <EmailView email={selectedEmail} onBack={handleBackToInbox} />;
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Your Temporary Email Address</CardTitle>
            {isLoading ? (
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
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <Skeleton className="h-10 flex-grow" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <Input
                readOnly
                value={account?.email || ""}
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
