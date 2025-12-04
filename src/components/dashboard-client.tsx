
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Copy,
  RefreshCw,
  Loader2,
  Clock,
  Trash2,
  Inbox,
  ServerCrash,
  Eye,
  Archive,
  Forward,
  Star,
  ArrowLeft,
  Mail,
  Search,
  Filter as FilterIcon,
  MoreHorizontal,
  Ban,
  ShieldAlert,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { type Email, type Inbox as InboxType } from "@/types";
import { EmailView } from "@/components/email-view";
import {
  useAuth,
  useFirestore,
  useUser,
  useMemoFirebase,
  useDoc,
  useCollection,
} from "@/firebase";
import {
  getDocs,
  getDoc,
  query,
  collection,
  where,
  doc,
  addDoc,
  serverTimestamp,
  deleteDoc,
  Timestamp,
  updateDoc,
  orderBy,
  limit,
} from "firebase/firestore";
import { type Plan } from "@/app/(admin)/admin/packages/data";
import { cn } from "@/lib/utils";
import { ScrollArea } from "./ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { signInAnonymously } from "firebase/auth";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import Image from "next/image";

const LOCAL_INBOX_KEY = "tempinbox_anonymous_inbox";

const demoEmails: Email[] = [
    {
      id: 'demo-1',
      inboxId: 'demo',
      userId: 'demo',
      senderName: 'Welcome Team <welcome@example.com>',
      subject: 'Getting Started with Tempmailoz',
      receivedAt: new Date().toISOString(),
      createdAt: Timestamp.now(),
      htmlContent: '<h1>Welcome!</h1><p>This is a demo email to showcase the layout. You can interact with the different elements to see how they behave.</p>',
      textContent: 'Welcome! This is a demo email to showcase the layout.',
      read: false,
    },
    {
      id: 'demo-2',
      inboxId: 'demo',
      userId: 'demo',
      senderName: 'Promotions',
      subject: 'Special Offer: 50% Off Premium! Plus, check out this very long subject line to see how truncation works in our new UI.',
      receivedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      createdAt: Timestamp.now(),
      htmlContent: '<p>Don\'t miss out on our special offer! Upgrade today to get more features like custom domains, email forwarding, and an ad-free experience.</p>',
      textContent: 'Don\'t miss out on our special offer!',
      read: true,
    },
     {
      id: 'demo-3',
      inboxId: 'demo',
      userId: 'demo',
      senderName: 'Security Alert',
      subject: 'Your account was accessed from a new device',
      receivedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      createdAt: Timestamp.now(),
      htmlContent: '<p>A new sign-in was detected from a new device. If this was not you, please secure your account immediately by changing your password.</p>',
      textContent: 'A new sign-in was detected. If this was not you, please secure your account immediately.',
      read: false,
    },
  ];


export function DashboardClient() {
  const [currentInbox, setCurrentInbox] = useState<InboxType | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [isQrOpen, setIsQrOpen] = useState(false);

  const firestore = useFirestore();
  const auth = useAuth();
  const { user, userProfile, isUserLoading } = useUser();
  const { toast } = useToast();

  const planRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    const planId = userProfile?.planId || "free-default";
    return doc(firestore, "plans", planId);
  }, [firestore, user, userProfile]);

  const { data: activePlan, isLoading: isLoadingPlan } = useDoc<Plan>(planRef);

  const emailsQuery = useMemoFirebase(() => {
    if (!firestore || !currentInbox?.id || !user) return null;
    return query(
      collection(firestore, `inboxes/${currentInbox.id}/emails`),
      orderBy("receivedAt", "desc")
    );
  }, [firestore, currentInbox?.id, user]);

  const { data: inboxEmails, isLoading: isLoadingEmails } =
    useCollection<Email>(emailsQuery);

  const displayedEmails = useMemo(() => {
    return isDemoMode ? demoEmails : (inboxEmails || []);
  }, [isDemoMode, inboxEmails]);

  const generateRandomString = useCallback((length: number) => {
    let result = "";
    const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }, []);

  const generateNewInbox = useCallback(
    async (activeUser: import("firebase/auth").User, plan: Plan) => {
      if (!firestore) {
        setServerError("Services not ready. Please try again in a moment.");
        return null;
      }

      setIsLoading(true);
      setServerError(null);

      const domainsQuery = query(
        collection(firestore, "allowed_domains"),
        where(
          "tier",
          "in",
          plan.features.allowPremiumDomains ? ["free", "premium"] : ["free"]
        )
      );

      try {
        const domainsSnapshot = await getDocs(domainsQuery);
        if (domainsSnapshot.empty)
          throw new Error("No domains are configured by the administrator.");

        const allowedDomains = domainsSnapshot.docs.map(
          (doc) => doc.data().domain as string
        );
        const randomDomain =
          allowedDomains[Math.floor(Math.random() * allowedDomains.length)];
        const emailAddress = `${generateRandomString(12)}@${randomDomain}`;

        const expiresAt = new Date(
          Date.now() + (plan.features.inboxLifetime || 10) * 60 * 1000
        );

        const newInboxData = {
          userId: activeUser.uid,
          emailAddress,
          domain: randomDomain,
          emailCount: 0,
          expiresAt: Timestamp.fromDate(expiresAt),
          createdAt: serverTimestamp(),
        };

        const newInboxRef = await addDoc(
          collection(firestore, `inboxes`),
          newInboxData
        );
        const newInbox = {
          id: newInboxRef.id,
          ...newInboxData,
          expiresAt: expiresAt.toISOString(),
        } as InboxType;

        if (activeUser.isAnonymous) {
          localStorage.setItem(
            LOCAL_INBOX_KEY,
            JSON.stringify({ id: newInbox.id, expiresAt: newInbox.expiresAt })
          );
        }
        return newInbox;
      } catch (error: any) {
        setServerError(
          error.message || "Could not generate a new email address."
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [firestore, generateRandomString]
  );

  useEffect(() => {
    const initializeSession = async () => {
      if (isUserLoading || !auth || !firestore) return;

      let activeUser = user;
      let foundInbox: InboxType | null = null;

      if (!activeUser) {
        try {
          const userCredential = await signInAnonymously(auth);
          activeUser = userCredential.user;
        } catch (error) {
          setServerError("Could not start a session. Please refresh the page.");
          setIsLoading(false);
          return;
        }
      }
      if (!activeUser) return;

      let planToUse: Plan | null = activePlan;
      if (!planToUse && !isLoadingPlan) {
        const defaultPlanRef = doc(firestore, "plans", "free-default");
        const defaultPlanSnap = await getDoc(defaultPlanRef);
        if (defaultPlanSnap.exists()) {
          planToUse = {
            id: defaultPlanSnap.id,
            ...defaultPlanSnap.data(),
          } as Plan;
        }
      }

      if (!planToUse) {
        if (!isLoadingPlan) {
          setServerError(
            "Default plan 'free-default' not found. Please contact support."
          );
        }
        return;
      }

      if (activeUser.isAnonymous) {
        const localDataStr = localStorage.getItem(LOCAL_INBOX_KEY);
        if (localDataStr) {
          try {
            const localData = JSON.parse(localDataStr);
            if (new Date(localData.expiresAt) > new Date()) {
              const inboxDoc = await getDoc(
                doc(firestore, "inboxes", localData.id)
              );
              if (inboxDoc.exists() && inboxDoc.data().userId === activeUser.uid) {
                const data = inboxDoc.data();
                const expiry =
                  data.expiresAt instanceof Timestamp
                    ? data.expiresAt.toDate().toISOString()
                    : data.expiresAt;
                foundInbox = {
                  id: inboxDoc.id,
                  ...data,
                  expiresAt: expiry,
                } as InboxType;
              }
            }
          } catch {
            localStorage.removeItem(LOCAL_INBOX_KEY);
          }
        }
      } else {
        const userInboxesQuery = query(
          collection(firestore, "inboxes"),
          where("userId", "==", activeUser.uid),
          limit(1)
        );
        const userInboxesSnap = await getDocs(userInboxesQuery);

        if (!userInboxesSnap.empty) {
          const latestInboxData = userInboxesSnap.docs[0].data();
          const expiry =
            latestInboxData.expiresAt instanceof Timestamp
              ? latestInboxData.expiresAt.toDate().toISOString()
              : latestInboxData.expiresAt;

          if (new Date(expiry) > new Date()) {
            foundInbox = { id: userInboxesSnap.docs[0].id, ...latestInboxData, expiresAt: expiry } as InboxType;
          }
        }
      }

      if (!foundInbox) {
        foundInbox = await generateNewInbox(activeUser, planToUse);
      }

      setCurrentInbox(foundInbox);
      setIsLoading(false);
    };

    initializeSession();
  }, [user, isUserLoading, activePlan, isLoadingPlan, auth, firestore, generateNewInbox]);

  useEffect(() => {
    if (!currentInbox?.expiresAt || !activePlan || !auth?.currentUser) return;

    const expiryDate = new Date(currentInbox.expiresAt);
    const interval = setInterval(async () => {
      const newCountdown = Math.floor(
        (expiryDate.getTime() - Date.now()) / 1000
      );
      setCountdown(newCountdown);

      if (newCountdown <= 0) {
        clearInterval(interval);
        setCurrentInbox(null);
        setSelectedEmail(null);
        if (user?.isAnonymous) {
          localStorage.removeItem(LOCAL_INBOX_KEY);
        }
        if (auth.currentUser && activePlan) {
          const newInbox = await generateNewInbox(auth.currentUser, activePlan);
          setCurrentInbox(newInbox);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentInbox, user?.isAnonymous, auth, generateNewInbox, activePlan]);

  const handleCopyEmail = () => {
    if (currentInbox?.emailAddress) {
      navigator.clipboard.writeText(currentInbox.emailAddress);
      toast({
        title: "Copied!",
        description: "Email address copied to clipboard.",
      });
    }
  };

  const handleDeleteAndRegenerate = async () => {
    if (!activePlan || !auth?.currentUser) return;
    setIsLoading(true);
    if (currentInbox && firestore) {
      await deleteDoc(doc(firestore, "inboxes", currentInbox.id));
    }
    if (user?.isAnonymous) {
      localStorage.removeItem(LOCAL_INBOX_KEY);
    }
    setCurrentInbox(null);
    setSelectedEmail(null);
    const newInbox = await generateNewInbox(auth.currentUser, activePlan);
    setCurrentInbox(newInbox);
    setIsLoading(false);
  };
  
  const handleToggleEmailSelection = (emailId: string) => {
    setSelectedEmails(prev => 
      prev.includes(emailId) ? prev.filter(id => id !== emailId) : [...prev, emailId]
    );
  };

  const handleSelectEmail = async (email: Email) => {
    setSelectedEmail(email);
    if (!email.read && currentInbox && firestore && !isDemoMode) {
      try {
        const emailRef = doc(
          firestore,
          `inboxes/${currentInbox.id}/emails`,
          email.id
        );
        await updateDoc(emailRef, { read: true });
      } catch (error) {
        console.error("Failed to mark email as read:", error);
      }
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(
      2,
      "0"
    )}`;
  };
  
  const handleToggleDemo = () => {
    setSelectedEmail(null);
    setIsDemoMode(prev => !prev);
  };
  
  const getReceivedDateTime = (date: string | Timestamp) => {
    const d = date instanceof Timestamp ? date.toDate() : new Date(date);
    return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
  }

  const parseSender = (sender: string) => {
    const match = sender.match(/(.*)<(.*)>/);
    if (match) {
        return { name: match[1].trim(), email: match[2].trim() };
    }
    if (sender.includes('@')) {
        return { name: sender, email: sender };
    }
    return { name: sender, email: '' };
  };

  if (isLoading) {
    return (
      <Card className="min-h-[480px] flex flex-col items-center justify-center text-center p-8 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">
          Initializing your secure inbox...
        </p>
      </Card>
    );
  }

  if (serverError && !currentInbox) {
    return (
      <Alert
        variant="destructive"
        className="mt-4 text-left min-h-[480px] flex flex-col justify-center items-center"
      >
        <ServerCrash className="h-10 w-10 mb-4" />
        <AlertTitle className="text-xl font-bold">
          Initialization Failed
        </AlertTitle>
        <AlertDescription className="text-base">{serverError}</AlertDescription>
      </Alert>
    );
  }

  if (!currentInbox || !activePlan) {
    return (
      <Card className="min-h-[480px] flex flex-col items-center justify-center text-center p-8 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Preparing your inbox...</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 p-2 border bg-card text-card-foreground rounded-lg">
        <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
          <Clock className={cn("h-4 w-4", countdown < 60 && countdown > 0 && "text-destructive")} />
          <span className={cn(countdown < 60 && countdown > 0 && "text-destructive")}>{formatTime(countdown)}</span>
        </div>

        <div
          onClick={handleCopyEmail}
          className="flex-grow flex items-center justify-center font-mono text-base md:text-lg text-foreground bg-muted hover:bg-secondary cursor-pointer p-2 rounded-md transition-colors group"
        >
          <span className="truncate">{currentInbox.emailAddress}</span>
          <Copy className="h-4 w-4 ml-2 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleDeleteAndRegenerate}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
           <Button onClick={handleToggleDemo} variant="outline" size="sm">
                <Eye className="h-4 w-4"/>
            </Button>
        </div>
      </div>

      {serverError && (
        <Alert variant="destructive">
          <ServerCrash className="h-4 w-4" />
          <AlertTitle>An Error Occurred</AlertTitle>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      {/* Main Content Area */}
      <Card className="flex-1">
        <CardContent className="p-0 h-full">
            {displayedEmails.length === 0 && !isLoadingEmails ? (
                 <div className="flex-grow flex flex-col items-center justify-center text-center py-12 px-4 text-muted-foreground space-y-4 min-h-[calc(100vh-400px)]">
                    <Inbox className="h-16 w-16 mb-4" />
                    <h3 className="text-xl font-semibold">Your inbox is empty.</h3>
                    <p>New mail will appear here automatically when received.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] h-full min-h-[calc(100vh-400px)]">
                    {/* Column 1: Inbox List */}
                    <div className="flex flex-col border-r">
                        <div className="p-2 py-2.5 border-b flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-sm">Inbox</h3>
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Inbox className="h-4 w-4" />
                                    <span className="text-xs">1 / {activePlan.features.maxInboxes}</span>
                                </div>
                            </div>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-2">
                                <div className="p-2 rounded-lg bg-muted flex items-center justify-between group relative">
                                    <div className="flex-1 flex items-center gap-2 truncate">
                                        <div className="relative flex-1 truncate">
                                            <span className="font-semibold text-sm truncate group-hover:hidden">{currentInbox.emailAddress}</span>
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1">
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {formatTime(countdown)}
                                                </span>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 transition-opacity">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                                                        <DropdownMenuItem><RefreshCw className="mr-2 h-4 w-4" /> Regenerate</DropdownMenuItem>
                                                        <DropdownMenuItem><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopyEmail}>
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent><p>Copy Email</p></TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        <Dialog open={isQrOpen} onOpenChange={setIsQrOpen}>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <DialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7">
                                                                <QrCode className="h-4 w-4" />
                                                            </Button>
                                                        </DialogTrigger>
                                                    </TooltipTrigger>
                                                    <TooltipContent><p>Show QR Code</p></TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            <DialogContent className="sm:max-w-xs">
                                                <DialogHeader>
                                                <DialogTitle>Scan QR Code</DialogTitle>
                                                <DialogDescription>
                                                    Scan this code on your mobile device to use this email address.
                                                </DialogDescription>
                                                </DialogHeader>
                                                <div className="flex items-center justify-center p-4">
                                                    <Image 
                                                        src={`https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(currentInbox.emailAddress)}`}
                                                        alt="QR Code for email address"
                                                        width={200}
                                                        height={200}
                                                    />
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                        <Badge variant="secondary">{displayedEmails.length}</Badge>
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    </div>
                    
                    {/* Column 2: Dynamic Content (Email List or Email View) */}
                    <div className="flex flex-col">
                        <div className="p-2 py-2.5 border-b flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-sm">Mail</h3>
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Mail className="h-4 w-4" />
                                    <span className="text-xs">{displayedEmails.length} / {activePlan.features.maxEmailsPerInbox === 0 ? '∞' : activePlan.features.maxEmailsPerInbox}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {selectedEmails.length > 0 ? (
                                    <>
                                        <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><Archive className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Archive</p></TooltipContent></Tooltip></TooltipProvider>
                                        <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Delete</p></TooltipContent></Tooltip></TooltipProvider>
                                    </>
                                ) : (
                                    <>
                                        <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><Search className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Search</p></TooltipContent></Tooltip></TooltipProvider>
                                        <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><FilterIcon className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Filter</p></TooltipContent></Tooltip></TooltipProvider>
                                    </>
                                )}
                                <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><Star className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Star</p></TooltipContent></Tooltip></TooltipProvider>
                                <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><Forward className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Forward</p></TooltipContent></Tooltip></TooltipProvider>
                            </div>
                        </div>
                        {selectedEmail ? (
                            <EmailView
                                email={{
                                    ...selectedEmail,
                                    receivedAt:
                                    selectedEmail.receivedAt instanceof Timestamp
                                        ? selectedEmail.receivedAt.toDate().toISOString()
                                        : selectedEmail.receivedAt,
                                }}
                                plan={activePlan}
                                onBack={() => setSelectedEmail(null)}
                                showBackButton={false}
                            />
                        ) : (
                            <ScrollArea className="h-full">
                                <div className="p-2 space-y-1">
                                    {displayedEmails.map((email) => {
                                        const sender = parseSender(email.senderName);
                                        const isSelected = selectedEmails.includes(email.id);
                                        return (
                                        <div
                                            key={email.id}
                                            onClick={() => handleSelectEmail(email)}
                                            className={cn(
                                                "group w-full text-left p-2 rounded-lg border-b border-transparent transition-colors cursor-pointer hover:bg-muted/50",
                                                !email.read && "bg-blue-500/5",
                                                isSelected && "bg-blue-500/10"
                                            )}
                                        >
                                            <div className="flex items-start gap-3 relative">
                                                <div className="pt-1 flex items-center h-full">
                                                    <Checkbox 
                                                        id={`select-${email.id}`} 
                                                        checked={isSelected}
                                                        onCheckedChange={() => handleToggleEmailSelection(email.id)}
                                                        onClick={(e) => e.stopPropagation()} // Prevent row click
                                                        className={cn(
                                                            "transition-opacity",
                                                            !isSelected && "opacity-0 group-hover:opacity-100"
                                                        )}
                                                    />
                                                </div>
                                                <div className="flex-grow grid grid-cols-12 gap-x-4 items-start">
                                                    <div className={cn("col-span-4", !email.read && "text-foreground")}>
                                                        <p className="font-semibold truncate text-sm">{sender.name}</p>
                                                        {sender.email && <p className="text-xs text-muted-foreground truncate">{sender.email}</p>}
                                                    </div>
                                                    <p className={cn("col-span-8 md:col-span-5 truncate text-sm self-center", !email.read ? "text-foreground font-medium" : "text-muted-foreground")}>{email.subject}</p>
                                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 h-full flex items-center">
                                                         <span className="text-xs text-muted-foreground group-hover:hidden">{getReceivedDateTime(email.receivedAt)}</span>
                                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden items-center gap-1 group-hover:flex">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-7 w-7 transition-opacity">
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                                                                    <DropdownMenuItem><Archive className="mr-2 h-4 w-4" /> Archive</DropdownMenuItem>
                                                                    <DropdownMenuItem><Star className="mr-2 h-4 w-4" /> Star</DropdownMenuItem>
                                                                    <DropdownMenuItem><Forward className="mr-2 h-4 w-4" /> Forward</DropdownMenuItem>
                                                                    <DropdownMenuItem><Ban className="mr-2 h-4 w-4" /> Block Sender</DropdownMenuItem>
                                                                    <DropdownMenuItem><ShieldAlert className="mr-2 h-4 w-4" /> Report Spam</DropdownMenuItem>
                                                                    <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )})}
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
