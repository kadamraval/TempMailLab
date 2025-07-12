"use client";

import { useState, useEffect, useCallback } from "react";
import { Copy, RefreshCw, Loader2, Clock, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { generateTempEmailAction } from "@/app/actions";
import type { Email } from "@/types";
import { InboxView } from "./inbox-view";
import { EmailView } from "./email-view";
import { Skeleton } from "./ui/skeleton";

const DUMMY_EMAILS: Omit<Email, "id" | "time" | "read">[] = [
  { sender: "Notion", subject: "5 ways to be more productive", body: "Discover new templates and workflows...", htmlBody: "<h1>Be More Productive</h1><p>Check out our new templates!</p>" },
  { sender: "GitHub", subject: "Your weekly digest is here", body: "Explore popular repositories and trends.", htmlBody: "<h1>Weekly Digest</h1><p>See what's new on <strong>GitHub</strong>.</p>" },
  { sender: "Amazon", subject: "Your order has shipped!", body: "Track your package for order #123-4567890.", htmlBody: "<h1>Order Shipped!</h1><p>Your package is on its way.</p>" },
  { sender: "Figma", subject: "New features for prototyping", body: "Create interactive components and more.", htmlBody: "<h1>New in Figma</h1><p>Design and prototype faster than ever.</p>" },
  { sender: "Netflix", subject: "New arrivals you might like", body: "We've added new shows and movies.", htmlBody: "<h1>Binge Time!</h1><p>Check out the latest arrivals.</p>" },
];


export function TempInboxClient() {
  const [email, setEmail] = useState("");
  const [inbox, setInbox] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [countdown, setCountdown] = useState(600); // 10 minutes
  const { toast } = useToast();

  const handleGenerateEmail = useCallback(async () => {
    setIsLoading(true);
    setSelectedEmail(null);
    setInbox([]);
    const newEmail = await generateTempEmailAction();
    if (newEmail) {
      setEmail(newEmail);
      setCountdown(600);
    } else {
      toast({
        title: "Error",
        description: "Could not generate a new email address.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    handleGenerateEmail();
  }, [handleGenerateEmail]);

  useEffect(() => {
    if (email && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (countdown === 0) {
        setEmail("");
    }
  }, [email, countdown]);

  useEffect(() => {
      if (!email) return;

      const newEmailInterval = setInterval(() => {
          setInbox(prevInbox => {
              const randomEmail = DUMMY_EMAILS[Math.floor(Math.random() * DUMMY_EMAILS.length)];
              const newEmail: Email = {
                  ...randomEmail,
                  id: Math.random().toString(36).substring(2),
                  time: new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(new Date()),
                  read: false,
              };
              return [newEmail, ...prevInbox];
          });
      }, 8000); // New email every 8 seconds

      return () => clearInterval(newEmailInterval);
  }, [email]);


  const handleCopyEmail = () => {
    navigator.clipboard.writeText(email);
    toast({
      title: "Copied!",
      description: "Email address copied to clipboard.",
    });
  };
  
  const handleSelectEmail = (email: Email) => {
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
             <Button onClick={() => setInbox([])} variant="ghost" size="sm" disabled={inbox.length === 0}>
                <Trash2 className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Clear Inbox</span>
             </Button>
            <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4" />
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
