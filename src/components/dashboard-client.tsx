"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Copy, RefreshCw, Loader2, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Inbox as InboxType, User, Email } from "@/types";
import { InboxView } from "./inbox-view";
import { EmailView } from "./email-view";
import { Skeleton } from "./ui/skeleton";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { addDoc, collection, serverTimestamp, getDocs, query, orderBy, deleteDoc, doc } from "firebase/firestore";
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


export function DashboardClient() {
  const [activeInbox, setActiveInbox] = useState<InboxType | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(600); // 10 minutes
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const emailsQuery = useMemoFirebase(() => {
    if (!user || !activeInbox) return null;
    return query(
        collection(firestore, "users", user.uid, "inboxes", activeInbox.id, "emails"),
        orderBy("receivedAt", "desc")
    );
  }, [firestore, user, activeInbox]);

  const { data: inbox, error: inboxError } = useCollection<Email>(emailsQuery);

  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  const handleGenerateEmail = useCallback(async () => {
    if (!user || !firestore) {
      toast({ title: "Error", description: "User not logged in.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setSelectedEmail(null);
    setActiveInbox(null);
    clearCountdown();

    try {
      // In a real app, you'd get this from admin settings
      const allowedDomain = "mg.yourdomain.com"; 
      const emailAddress = `${generateRandomString(12)}@${allowedDomain}`;

      const inboxRef = collection(firestore, "users", user.uid, "inboxes");
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

      const newInboxDoc = await addDoc(inboxRef, {
        userId: user.uid,
        emailAddress,
        createdAt: serverTimestamp(),
        expiresAt: expiresAt,
      });

      const newInbox: InboxType = {
        id: newInboxDoc.id,
        userId: user.uid,
        emailAddress,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
      };
      
      setActiveInbox(newInbox);
      setCountdown(600);

    } catch (error) {
      console.error("Error generating new inbox:", error);
      toast({
        title: "Error",
        description: "Could not generate a new email address.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, firestore, toast]);

  useEffect(() => {
    if (user && !activeInbox) {
      handleGenerateEmail();
    }
    if (!user) {
        setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);


  useEffect(() => {
    if (activeInbox && countdown > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearCountdown();
    } else if (countdown === 0) {
        toast({
            title: "Session Expired",
            description: "Your temporary email has expired. Generate a new one.",
        })
      setActiveInbox(null);
    }
  }, [activeInbox, countdown, toast]);

  const handleRefresh = async () => {
    if (!activeInbox || !user) return;
    setIsRefreshing(true);
    try {
        const result = await fetchEmailsFromServerAction(user.uid, activeInbox.id, activeInbox.emailAddress);
        if (result.error) {
          throw new Error(result.error);
        }
        toast({ title: "Inbox refreshed", description: `${result.emailsAdded || 0} new emails.` });
    } catch (error: any) {
        console.error("Error fetching emails:", error);
        toast({ title: "Error", description: error.message || "Could not refresh inbox.", variant: "destructive" });
    }
    setIsRefreshing(false);
  };


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
  };

  const handleBackToInbox = () => setSelectedEmail(null);

  const handleDeleteInbox = async () => {
    if (!user || !activeInbox || !inbox) return;
    
    const emailIds = inbox.map(e => e.id);
    const deletePromises = emailIds.map(id => {
        const emailRef = doc(firestore, "users", user.uid, "inboxes", activeInbox.id, "emails", id);
        return deleteDoc(emailRef);
    });

    try {
        await Promise.all(deletePromises);
        toast({
            title: "Inbox Cleared",
            description: "Messages deleted successfully.",
        });
    } catch (error) {
        toast({
            title: "Error",
            description: "Could not clear all messages.",
            variant: "destructive"
        });
    }
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
                 <Button onClick={handleRefresh} variant="outline" className="w-full sm:w-auto" disabled={isRefreshing || !activeInbox}>
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
          <Button onClick={handleDeleteInbox} variant="ghost" size="sm" disabled={!inbox || inbox.length === 0}>
            <Trash2 className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">Clear Inbox</span>
          </Button>
        </CardHeader>
        <CardContent>
          <InboxView inbox={inbox || []} onSelectEmail={handleSelectEmail} />
        </CardContent>
      </Card>
    </div>
  );
}