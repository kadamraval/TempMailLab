"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Copy, RefreshCw, Loader2, Clock, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { generateTempEmailAction, getInboxAction, getSingleEmailAction } from "@/app/actions";
import type { Email } from "@/types";
import { InboxView } from "./inbox-view";
import { EmailView } from "./email-view";
import { Skeleton } from "./ui/skeleton";
import { cn } from "@/lib/utils";

export function TempInboxClient() {
  const [email, setEmail] = useState("");
  const [inbox, setInbox] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(600); // 10 minutes
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearInboxInterval = () => {
    if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
    }
  }

  const fetchInbox = useCallback(async (currentEmail: string, isManualRefresh: boolean = false) => {
    if (!currentEmail) return;
    if (isManualRefresh) {
        setIsRefreshing(true);
    }
    const [login, domain] = currentEmail.split("@");
    const fetchedMessages = await getInboxAction(login, domain);
    
    // Naive check to see if new emails have arrived.
    if (fetchedMessages.length > inbox.length) {
        setInbox(fetchedMessages);
    }
    if (isManualRefresh) {
        setInbox(fetchedMessages);
        setIsRefreshing(false);
        toast({ title: "Inbox refreshed" });
    }
  }, [inbox.length, toast]);

  const handleGenerateEmail = useCallback(async () => {
    setIsLoading(true);
    setSelectedEmail(null);
    setInbox([]);
    clearInboxInterval();

    const newEmail = await generateTempEmailAction();
    if (newEmail) {
      setEmail(newEmail);
      setCountdown(600);
      // Start fetching inbox for the new email
      fetchInbox(newEmail);
      intervalRef.current = setInterval(() => fetchInbox(newEmail), 5000); // Check every 5 seconds
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
    // Clear interval on component unmount
    return () => clearInboxInterval();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (email && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (countdown === 0) {
        setEmail("");
        setInbox([]);
        clearInboxInterval();
    }
  }, [email, countdown]);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(email);
    toast({
      title: "Copied!",
      description: "Email address copied to clipboard.",
    });
  };
  
  const handleSelectEmail = async (email: Email) => {
    // If we don't have the body, fetch it.
    if (!email.body) {
      const [login, domain] = email.from.split('@'); // This was using selectedEmail which would be stale
      const fullEmail = await getSingleEmailAction(login, domain, email.id);
      if (fullEmail) {
        setSelectedEmail(fullEmail);
         setInbox(inbox.map(e => e.id === email.id ? { ...fullEmail, read: true } : e));
         return;
      } else {
        toast({ title: "Error", description: "Could not fetch email content.", variant: "destructive" });
        return;
      }
    }
    setSelectedEmail(email);
    setInbox(inbox.map(e => e.id === email.id ? { ...e, read: true } : e));
  };
  
  const handleBackToInbox = () => setSelectedEmail(null);

  const handleDeleteInbox = () => {
    setInbox([]);
    toast({
      title: "Inbox Cleared",
      description: "All messages have been deleted.",
    });
  }

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
          <CardTitle>Your Temporary Email Address</CardTitle>
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
                value={email}
                className="text-lg text-center sm:text-left font-mono"
              />
              <div className="flex gap-2 w-full sm:w-auto">
                <Button onClick={handleCopyEmail} variant="outline" className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90">
                  <Copy className="mr-2 h-4 w-4" /> Copy
                </Button>
                <Button onClick={handleGenerateEmail} className="w-full sm:w-auto">
                  <RefreshCw className="mr-2 h-4 w-4" /> New
                </Button>
              </div>
            </div>
          )}
          <div className="flex items-center justify-center text-sm text-muted-foreground pt-2">
             {isLoading ? (
                <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating...</span>
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Address expires in: {formatTime(countdown)}</span>
                </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Inbox</CardTitle>
          <div className="flex items-center gap-2">
             <Button onClick={handleDeleteInbox} variant="ghost" size="sm" disabled={inbox.length === 0}>
                <Trash2 className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Clear Inbox</span>
             </Button>
            <Button onClick={() => fetchInbox(email, true)} variant="outline" size="sm" disabled={isRefreshing}>
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                <span className="ml-2 hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <InboxView inbox={inbox} onSelectEmail={handleSelectEmail} />
        </CardContent>
      </Card>
    </div>
  );
}
