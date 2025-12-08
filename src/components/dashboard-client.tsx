
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
  ChevronsUpDown,
  Download,
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuCheckboxItem, DropdownMenuLabel } from "./ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import Image from "next/image";
import { Separator } from "./ui/separator";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Progress } from "./ui/progress";


const LOCAL_INBOX_KEY = "tempinbox_anonymous_inbox";

const demoInboxes: InboxType[] = Array.from({ length: 15 }, (_, i) => ({
    id: `demo-inbox-${i + 1}`,
    emailAddress: i === 0 ? 'primary-demo@example.com' : `project-${i}@example.com`,
    emailCount: Math.floor(Math.random() * 20),
    userId: 'demo',
    domain: 'example.com',
    expiresAt: new Date(Date.now() + (10 + i * 5) * 60 * 1000).toISOString(),
    isStarred: i === 1 || i === 4,
    isArchived: i === 7,
}));

const demoEmails: Email[] = Array.from({ length: 25 }, (_, i) => ({
    id: `demo-${i + 1}`,
    inboxId: demoInboxes[i % demoInboxes.length].id, // Assign emails to different inboxes
    userId: 'demo',
    senderName: ['Welcome Team <welcome@example.com>', 'Promotions <promo@example.com>', 'Security Alert <security@example.com>', 'Newsletter <news@example.com>', 'Support <support@example.com>', 'Feedback Request <feedback@example.com>'][i % 6],
    subject: [ 'Getting Started with Tempmailoz', 'Special Offer: 50% Off Premium!', 'Your account was accessed from a new device', 'Weekly Digest - Top Stories', 'Your Support Ticket #12345 has been updated', 'How was your experience?', 'Re: Your Question', 'Password Reset Request' ][i % 8],
    receivedAt: new Date(Date.now() - i * 15 * 60 * 1000).toISOString(),
    createdAt: Timestamp.now(),
    htmlContent: `<p>This is a demo email #${i+1} for the inbox <strong>${demoInboxes[i % demoInboxes.length].emailAddress}</strong> to showcase the layout. You can interact with the different elements to see how they behave.</p>`,
    textContent: `This is a demo email #${i+1} for ${demoInboxes[i % demoInboxes.length].emailAddress}.`,
    read: i % 2 === 1,
    isSpam: i === 5,
    isBlocked: i === 8,
    isStarred: i === 2 || i === 9,
    isArchived: i === 12
}));


const ITEMS_PER_PAGE = 10;

export function DashboardClient() {
  const [currentInbox, setCurrentInbox] = useState<InboxType | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [countdown, setCountdown] = useState({ total: 0, remaining: 0 });
  const [serverError, setServerError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  // States for multi-selection
  const [selectedInboxes, setSelectedInboxes] = useState<string[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  const [isQrOpen, setIsQrOpen] = useState(false);
  const [visibleInboxesCount, setVisibleInboxesCount] = useState(ITEMS_PER_PAGE);
  const [visibleEmailsCount, setVisibleEmailsCount] = useState(ITEMS_PER_PAGE);
  const [activeInboxFilter, setActiveInboxFilter] = useState('All');
  const [activeMailFilter, setActiveMailFilter] = useState('All');
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [prefixInput, setPrefixInput] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedLifetime, setSelectedLifetime] = useState<string | undefined>(undefined);

  // Demo mode specific state
  const [activeDemoInbox, setActiveDemoInbox] = useState<InboxType | null>(demoInboxes[0]);

  const firestore = useFirestore();
  const auth = useAuth();
  const { user, userProfile, isUserLoading } = useUser();
  const { toast } = useToast();
  
  const planId = userProfile?.planId || 'free-default';
  const planRef = useMemoFirebase(() => (firestore && planId) ? doc(firestore, 'plans', planId) : null, [firestore, planId]);
  const { data: activePlan, isLoading: isLoadingPlan } = useDoc<Plan>(planRef);

  const allowedDomainsQuery = useMemoFirebase(() => {
    if (!firestore || !activePlan) return null;
    const tiers = activePlan.features.allowPremiumDomains ? ["free", "premium"] : ["free"];
    return query(collection(firestore, "allowed_domains"), where("tier", "in", tiers));
  }, [firestore, activePlan]);
  const { data: allowedDomains, isLoading: isLoadingDomains } = useCollection(allowedDomainsQuery);

  
  const inboxQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'inboxes'), where('userId', '==', user.uid));
  }, [firestore, user?.uid]);
  const { data: userInboxes } = useCollection<InboxType>(inboxQuery);


  const emailsQuery = useMemoFirebase(() => {
    if (!firestore || !currentInbox?.id || !user) return null;
    return query(
      collection(firestore, `inboxes/${currentInbox.id}/emails`),
      orderBy("receivedAt", "desc")
    );
  }, [firestore, currentInbox?.id, user]);

  const { data: inboxEmails, isLoading: isLoadingEmails } =
    useCollection<Email>(emailsQuery);

  const displayedInboxes = useMemo(() => {
      // This is a placeholder for inbox filtering logic
      return isDemoMode ? demoInboxes : (userInboxes || []);
  }, [isDemoMode, userInboxes, activeInboxFilter]);

  const filteredEmails = useMemo(() => {
    const sourceEmails = isDemoMode 
        ? demoEmails.filter(e => e.inboxId === activeDemoInbox?.id)
        : (inboxEmails || []);

    let filtered = sourceEmails;

    switch (activeMailFilter) {
        case 'Unread':
            filtered = sourceEmails.filter(e => !e.read);
            break;
        case 'Starred':
            filtered = sourceEmails.filter(e => e.isStarred);
            break;
        case 'Archived':
            filtered = sourceEmails.filter(e => e.isArchived);
            break;
        case 'Blocked':
            filtered = sourceEmails.filter(e => e.isBlocked);
            break;
        case 'Spam':
            filtered = sourceEmails.filter(e => e.isSpam);
            break;
        default: // All, New, Old
            filtered = sourceEmails;
    }

    if (searchQuery) {
        filtered = filtered.filter(e => 
            e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.senderName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }
    
    if (activeMailFilter === 'Old') {
        return filtered.sort((a,b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime());
    }
    // New and All sort by newest first
    return filtered.sort((a,b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
  }, [isDemoMode, inboxEmails, activeDemoInbox, activeMailFilter, searchQuery]);


  const generateRandomString = useCallback((length: number) => {
    let result = "";
    const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }, []);
  
  useEffect(() => {
     if (!selectedDomain && allowedDomains && allowedDomains.length > 0) {
      setSelectedDomain(allowedDomains[0].domain);
    }
    if (!selectedLifetime && activePlan) {
        setSelectedLifetime(`${activePlan.features.inboxLifetime.count}_${activePlan.features.inboxLifetime.unit}`)
    }
  }, [allowedDomains, selectedDomain, activePlan, selectedLifetime]);


  const createNewInbox = useCallback(
    async (activeUser: import("firebase/auth").User, plan: Plan) => {
        if (!firestore || !allowedDomains) {
            setServerError("Services not ready. Please try again in a moment.");
            return null;
        }
        
        if (!prefixInput) {
            toast({ title: "Prefix Required", description: "Please enter a name for your inbox or use the 'Auto' button for a suggestion.", variant: "destructive" });
            return;
        }

        setIsCreating(true);
        setServerError(null);

        try {
            if (allowedDomains.length === 0) throw new Error("No domains are configured by the administrator.");
            
            const domainToUse = selectedDomain || allowedDomains[0]?.domain;
            if (!domainToUse) throw new Error("Could not determine a domain to use.");
            
            const emailAddress = `${prefixInput}@${domainToUse}`;

            // Check if inbox already exists
            const existingInboxQuery = query(collection(firestore, 'inboxes'), where('emailAddress', '==', emailAddress), limit(1));
            const existingInboxSnapshot = await getDocs(existingInboxQuery);
            if (!existingInboxSnapshot.empty) {
                throw new Error(`The email address '${emailAddress}' is already taken. Please choose another.`);
            }
            
            const [count, unit] = selectedLifetime!.split('_');
            const lifetimeInMs = parseInt(count) * (unit === 'minutes' ? 60 : (unit === 'hours' ? 3600 : 86400)) * 1000;
            const expiresAt = new Date(Date.now() + lifetimeInMs);

            const newInboxData = {
                userId: activeUser.uid,
                emailAddress,
                domain: domainToUse,
                emailCount: 0,
                expiresAt: Timestamp.fromDate(expiresAt),
                createdAt: serverTimestamp(),
            };

            const newInboxRef = await addDoc(collection(firestore, `inboxes`), newInboxData);
            const newInbox = { id: newInboxRef.id, ...newInboxData, expiresAt: expiresAt.toISOString() } as InboxType;

            if (activeUser.isAnonymous) {
                localStorage.setItem(LOCAL_INBOX_KEY, JSON.stringify({ id: newInbox.id, expiresAt: newInbox.expiresAt }));
            }
            
            setCurrentInbox(newInbox);
            navigator.clipboard.writeText(emailAddress);
            toast({ title: "Created & Copied!", description: "New temporary email copied to clipboard." });
            setPrefixInput(''); // Clear input after creation
            
        } catch (error: any) {
            toast({
                title: "Creation Failed",
                description: error.message || "Could not generate a new email address.",
                variant: "destructive"
            });
            setServerError(error.message || "Could not generate a new email address.");
        } finally {
            setIsCreating(false);
        }
    }, [firestore, allowedDomains, prefixInput, selectedDomain, toast, selectedLifetime]
  );
  
  const findActiveInbox = useCallback(async (uid: string) => {
    if (!firestore) return null;
    
    const userInboxesQuery = query(collection(firestore, 'inboxes'), where('userId', '==', uid));
    const snap = await getDocs(userInboxesQuery);
    
    if (snap.empty) return null;

    const now = new Date();
    
    const sortedInboxes = snap.docs
        .map(doc => {
            const data = doc.data();
            const createdAtDate = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date();
            
            let expiresAtDate: Date;
            if (data.expiresAt instanceof Timestamp) {
                expiresAtDate = data.expiresAt.toDate();
            } else if (typeof data.expiresAt === 'string') {
                expiresAtDate = new Date(data.expiresAt);
            } else {
                expiresAtDate = new Date(0); // Fallback for unexpected format
            }

            return { id: doc.id, ...data, expiresAt: expiresAtDate.toISOString(), createdAt: createdAtDate } as InboxType & { createdAt: Date };
        })
        .filter(inbox => new Date(inbox.expiresAt) > now)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (sortedInboxes.length === 0) return null;
    
    return sortedInboxes[0];
  }, [firestore]);


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
          planToUse = { id: defaultPlanSnap.id, ...defaultPlanSnap.data() } as Plan;
        }
      }

      if (!planToUse) {
        if (!isLoadingPlan && !isUserLoading) {
          setServerError("Default plan 'free-default' not found. Please contact support.");
        }
        setIsLoading(false);
        return;
      }

      if (activeUser.isAnonymous) {
        const localDataStr = localStorage.getItem(LOCAL_INBOX_KEY);
        if (localDataStr) {
          try {
            const localData = JSON.parse(localDataStr);
            if (new Date(localData.expiresAt) > new Date()) {
              const inboxDoc = await getDoc(doc(firestore, "inboxes", localData.id));
              if (inboxDoc.exists() && inboxDoc.data().userId === activeUser.uid) {
                const data = inboxDoc.data();
                
                let expiresAtDate: Date;
                if (data.expiresAt instanceof Timestamp) {
                  expiresAtDate = data.expiresAt.toDate();
                } else if (typeof data.expiresAt === 'string') {
                  expiresAtDate = new Date(data.expiresAt);
                } else {
                  expiresAtDate = new Date(0); // Should not happen
                }

                foundInbox = { id: inboxDoc.id, ...data, expiresAt: expiresAtDate.toISOString() } as InboxType;
              }
            }
          } catch { localStorage.removeItem(LOCAL_INBOX_KEY); }
        }
      } else {
        foundInbox = await findActiveInbox(activeUser.uid);
      }
      
      setCurrentInbox(foundInbox);
      setIsLoading(false);
    };

    initializeSession();
  }, [user, isUserLoading, activePlan, isLoadingPlan, auth, firestore, findActiveInbox]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentInbox?.expiresAt) {
      const expiryDate = new Date(currentInbox.expiresAt);
      const creationDate = currentInbox.createdAt instanceof Timestamp ? currentInbox.createdAt.toDate() : new Date(0);
      const totalDuration = expiryDate.getTime() - creationDate.getTime();

      interval = setInterval(() => {
        const remainingMs = expiryDate.getTime() - Date.now();
        setCountdown({ total: totalDuration, remaining: remainingMs > 0 ? remainingMs : 0 });
        if (remainingMs <= 0) {
          clearInterval(interval);
          setCurrentInbox(null);
          setSelectedEmail(null);
          if (user?.isAnonymous) localStorage.removeItem(LOCAL_INBOX_KEY);
        }
      }, 1000);
    } else {
       setCountdown({ total: 0, remaining: 0 });
    }
    return () => clearInterval(interval);
  }, [currentInbox, user?.isAnonymous]);
  
  const handleCopyEmail = () => {
    if (currentInbox?.emailAddress) {
      navigator.clipboard.writeText(currentInbox.emailAddress);
      toast({ title: "Copied!", description: "Email address copied to clipboard." });
    }
  };

  const handleDeleteAndRegenerate = async () => {
    if (!auth?.currentUser) return;
    setIsCreating(true);
    if (currentInbox && firestore) {
      await deleteDoc(doc(firestore, "inboxes", currentInbox.id));
    }
    if (user?.isAnonymous) localStorage.removeItem(LOCAL_INBOX_KEY);
    setCurrentInbox(null);
    setSelectedEmail(null);
    setPrefixInput(''); // Reset prefix
    setIsCreating(false); // Let createNewInbox handle the new creation
  };
  
  const handleToggleEmailSelection = (emailId: string) => {
    setSelectedEmails(prev => 
      prev.includes(emailId) ? prev.filter(id => id !== emailId) : [...prev, emailId]
    );
  };
  const handleToggleInboxSelection = (inboxId: string) => {
    setSelectedInboxes(prev =>
        prev.includes(inboxId) ? prev.filter(id => id !== inboxId) : [...prev, inboxId]
    );
  };

  const handleSelectEmail = async (email: Email) => {
    setSelectedEmail(email);
    if (!email.read && currentInbox && firestore && !isDemoMode) {
      try {
        const emailRef = doc(firestore, `inboxes/${currentInbox.id}/emails`, email.id);
        await updateDoc(emailRef, { read: true });
      } catch (error) { console.error("Failed to mark email as read:", error); }
    }
  };
  
  const handleToggleDemo = () => {
    setSelectedEmail(null);
    setIsDemoMode(prev => !prev);
  };
  
  const getReceivedDateTime = (date: string | Timestamp) => {
    const d = date instanceof Timestamp ? date.toDate() : new Date(date);
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  const parseSender = (sender: string) => {
    const match = sender.match(/(.*)<(.*)>/);
    if (match) return { name: match[1].trim().replace(/"/g, ''), email: match[2].trim() };
    if (sender.includes('@')) return { name: sender, email: sender };
    return { name: sender, email: '' };
  };

  const renderEmptyState = () => (
    <div className="flex-grow flex flex-col items-center justify-center text-center py-12 px-4 text-muted-foreground space-y-4 min-h-[calc(100vh-400px)]">
      <Inbox className="h-16 w-16 mb-4" />
      <h3 className="text-xl font-semibold">No Matching Emails</h3>
      <p>There are no messages that match your current filter.</p>
    </div>
  );

  if (isLoading || isLoadingDomains) {
    return (
      <Card className="min-h-[480px] flex flex-col items-center justify-center text-center p-8 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Initializing your secure inbox...</p>
      </Card>
    );
  }

  if (serverError && !currentInbox) {
    return (
      <Alert variant="destructive" className="mt-4 text-left min-h-[480px] flex flex-col justify-center items-center">
        <ServerCrash className="h-10 w-10 mb-4" />
        <AlertTitle className="text-xl font-bold">Initialization Failed</AlertTitle>
        <AlertDescription className="text-base">{serverError}</AlertDescription>
      </Alert>
    );
  }
  
  if (!activePlan) {
    return (
      <Card className="min-h-[480px] flex flex-col items-center justify-center text-center p-8 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading plan details...</p>
      </Card>
    );
  }

  const mailFilterOptions = ["All", "New", "Old", "Unread", "Starred", "Spam", "Blocked"];
  const inboxFilterOptions = ["All", "New", "Old", "Unread", "Starred", "Archive"];
  
  const countdownMinutes = Math.floor(countdown.remaining / 60000);
  const countdownSeconds = Math.floor((countdown.remaining % 60000) / 1000);
  const progress = countdown.total > 0 ? (countdown.remaining / countdown.total) * 100 : 0;


  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Header */}
       <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-center gap-4">
             <Card className="p-1.5 w-full h-14">
                {currentInbox ? (
                    <div className="flex items-center gap-2 h-full">
                        <div className="relative h-8 w-8 ml-1">
                            <Progress value={progress} className="absolute inset-0 h-full w-full -rotate-90 [&>div]:bg-primary rounded-full" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Clock className="h-4 w-4 text-primary" />
                            </div>
                        </div>
                        <span className="text-sm font-mono">{`${String(countdownMinutes).padStart(2, '0')}:${String(countdownSeconds).padStart(2, '0')}`}</span>
                        <Separator orientation="vertical" className="h-6 mx-2" />
                        <p className="font-mono flex-grow text-center text-base">{currentInbox.emailAddress}</p>
                        <TooltipProvider><Tooltip><TooltipTrigger asChild>
                            <Button onClick={() => setIsQrOpen(true)} variant="ghost" size="icon" className="h-8 w-8"><QrCode className="h-5 w-5" /></Button>
                        </TooltipTrigger><TooltipContent><p>Show QR Code</p></TooltipContent></Tooltip></TooltipProvider>
                        <Button onClick={handleCopyEmail} className="h-full"><Copy className="h-4 w-4 mr-2"/>Copy</Button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 h-full">
                         <Select value={selectedLifetime} onValueChange={setSelectedLifetime}>
                            <SelectTrigger className="w-auto border-0 bg-transparent h-full focus:ring-0 focus:ring-offset-0 px-2 group ml-1 mr-2 focus-visible:ring-0 focus-visible:ring-offset-0">
                                <Clock className="h-4 w-4 mr-2 text-muted-foreground group-hover:text-foreground transition-colors" />
                                <SelectValue placeholder="Lifetime" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10_minutes">10 Minutes</SelectItem>
                                <SelectItem value="30_minutes">30 Minutes</SelectItem>
                                <SelectItem value="1_hours">1 Hour</SelectItem>
                                <SelectItem value="6_hours">6 Hours</SelectItem>
                                <SelectItem value="1_days">1 Day</SelectItem>
                            </SelectContent>
                        </Select>
                        
                        <div className="flex-grow flex items-center h-full rounded-md bg-background border px-2">
                            <Button variant="ghost" size="sm" className="h-7 ml-1 group" onClick={() => setPrefixInput(generateRandomString(10))}>
                                <Mail className="h-4 w-4 mr-2 text-muted-foreground group-hover:text-foreground transition-colors" />
                                Auto
                            </Button>
                            <Input 
                                value={prefixInput}
                                onChange={(e) => setPrefixInput(e.target.value)}
                                className="flex-grow !border-0 !ring-0 !shadow-none p-0 pl-2 font-mono text-base bg-transparent h-full focus-visible:ring-0 focus-visible:ring-offset-0"
                                placeholder="your-prefix"
                            />
                            <span className="text-muted-foreground -ml-1">@</span>
                            <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                                <SelectTrigger className="w-auto border-0 bg-transparent focus:ring-0 focus:ring-offset-0 font-mono text-base h-full focus-visible:ring-0 focus-visible:ring-offset-0 pr-1 group">
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    {allowedDomains?.map(d => (
                                        <SelectItem key={d.id} value={d.domain}>{d.domain}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                         <Button onClick={() => createNewInbox(auth!.currentUser!, activePlan)} disabled={isCreating} className="h-full ml-2">
                            <Copy className="mr-2 h-4 w-4"/>
                            Create
                        </Button>
                    </div>
                )}
            </Card>
            
            <div className="flex items-center gap-2 justify-self-start md:justify-self-end">
                <Button onClick={handleDeleteAndRegenerate} variant="outline" size="default" className="h-14">
                    <RefreshCw className="h-4 w-4 mr-2"/>Regenerate
                </Button>
                <Button onClick={handleToggleDemo} variant="outline" size="default" className="h-14">
                    <Eye className="h-4 w-4 mr-2"/>Demo
                </Button>
            </div>
        </div>
      
       <Dialog open={isQrOpen} onOpenChange={setIsQrOpen}>
            <DialogContent className="sm:max-w-xs">
                <DialogHeader>
                <DialogTitle>Scan QR Code</DialogTitle>
                <DialogDescription>
                    Scan this code on your mobile device to use this email address.
                </DialogDescription>
                </DialogHeader>
                <div className="flex items-center justify-center p-4">
                    <Image 
                        src={`https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(currentInbox?.emailAddress || '')}`}
                        alt="QR Code for email address"
                        width={200}
                        height={200}
                    />
                </div>
            </DialogContent>
        </Dialog>

      {serverError && !isCreating && (
        <Alert variant="destructive">
          <ServerCrash className="h-4 w-4" />
          <AlertTitle>An Error Occurred</AlertTitle>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      {/* Main Content Area */}
      <Card className="flex-1">
        <CardContent className="p-0 h-full">
            {(filteredEmails.length === 0 && !isLoadingEmails && !isDemoMode) ? (
                 <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] h-full min-h-[calc(100vh-400px)]">
                    <div className="flex flex-col border-r h-full">{/* Left col for consistency */}</div>
                    {renderEmptyState()}
                 </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] h-full min-h-[calc(100vh-400px)]">
                    {/* Column 1: Inbox List */}
                    <div className="flex flex-col border-r">
                        <div className="p-2 py-2.5 border-b flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Inbox className="h-4 w-4 text-muted-foreground" />
                                <h3 className="font-semibold text-sm">{`Inbox (${Math.min(visibleInboxesCount, displayedInboxes.length)}/${displayedInboxes.length})`}</h3>
                            </div>
                            <div className="flex items-center gap-1">
                                {selectedInboxes.length > 0 ? (
                                    <>
                                        <Button variant="ghost" size="icon" className="h-7 w-7"><Star className="h-4 w-4"/></Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7"><Archive className="h-4 w-4"/></Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                    </>
                                ) : (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7"><FilterIcon className="h-4 w-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Filter Inboxes</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            {inboxFilterOptions.map(filter => (
                                                <DropdownMenuCheckboxItem key={filter} checked={activeInboxFilter === filter} onSelect={() => setActiveInboxFilter(filter)}>{filter}</DropdownMenuCheckboxItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        </div>
                        <ScrollArea className="flex-1 h-[calc(100vh-480px)]">
                            <div className="p-2 space-y-0">
                                {displayedInboxes.slice(0, visibleInboxesCount).map((inbox) => {
                                    const isSelected = selectedInboxes.includes(inbox.id);
                                    const isActive = isDemoMode ? activeDemoInbox?.id === inbox.id : currentInbox?.id === inbox.id;
                                    const expiresDate = new Date(inbox.expiresAt);
                                    return (
                                    <div 
                                        key={inbox.id} 
                                        className={cn("p-2 group relative border-b cursor-pointer", isActive && "bg-muted")}
                                        onClick={() => isDemoMode ? setActiveDemoInbox(inbox) : setCurrentInbox(inbox)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1 truncate flex items-center gap-2">
                                                 <Checkbox 
                                                    id={`select-inbox-${inbox.id}`} 
                                                    checked={isSelected}
                                                    onCheckedChange={() => handleToggleInboxSelection(inbox.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className={cn("transition-opacity", !isSelected && "opacity-0 group-hover:opacity-100", isSelected && "opacity-100")}
                                                 />
                                                <div className="truncate flex-1">
                                                  <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-sm truncate">{inbox.emailAddress}</span>
                                                  </div>
                                                  <div className="text-xs text-muted-foreground">
                                                      Expires: {expiresDate.toLocaleTimeString()}
                                                  </div>
                                                </div>
                                            </div>
                                             <div className="flex items-center gap-2">
                                                <div className="relative h-7 w-7 flex items-center justify-center">
                                                    {inbox.isStarred && <Star className="h-4 w-4 text-yellow-500 shrink-0" />}
                                                    {inbox.isArchived && <Archive className="h-4 w-4 text-muted-foreground shrink-0" />}
                                                    <Badge variant={isActive ? "default" : "secondary"} className="transition-opacity group-hover:opacity-0">{inbox.emailCount}</Badge>
                                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                                                        <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}><Copy className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Copy</p></TooltipContent></Tooltip></TooltipProvider>
                                                        <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}><QrCode className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>QR Code</p></TooltipContent></Tooltip></TooltipProvider>
                                                        <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}><Star className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Star</p></TooltipContent></Tooltip></TooltipProvider>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                                                <DropdownMenuItem>Export</DropdownMenuItem>
                                                                <DropdownMenuItem>Archive</DropdownMenuItem>
                                                                <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )})}
                                {visibleInboxesCount < displayedInboxes.length && (
                                     <Button variant="outline" className="w-full mt-2" onClick={() => setVisibleInboxesCount(c => c + ITEMS_PER_PAGE)}>Load More</Button>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                    
                    {/* Column 2: Dynamic Content (Email List or Email View) */}
                    <div className="flex flex-col">
                        <div className="p-2 py-2.5 border-b flex items-center justify-between">
                             <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <h3 className="font-semibold text-sm">{`Mail (${Math.min(visibleEmailsCount, filteredEmails.length)}/${filteredEmails.length})`}</h3>
                            </div>
                            <div className={cn("flex items-center gap-1", isSearching && "flex-grow")}>
                                {selectedEmail ? (
                                    <>
                                        <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><Archive className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Archive</p></TooltipContent></Tooltip></TooltipProvider>
                                        <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Delete</p></TooltipContent></Tooltip></TooltipProvider>
                                    </>
                                 ) : (
                                    <>
                                        {selectedEmails.length > 0 ? (
                                             <>
                                                <Button variant="ghost" size="icon" className="h-7 w-7"><Archive className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="h-4 w-4" /></Button>
                                                <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><Star className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Star</p></TooltipContent></Tooltip></TooltipProvider>
                                                <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><Forward className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Forward</p></TooltipContent></Tooltip></TooltipProvider>
                                            </>
                                        ) : (
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsSearching(true)}><Search className="h-4 w-4" /></Button>
                                        )}

                                        {isSearching && selectedEmails.length === 0 && !selectedEmail ? (
                                            <div className="w-full relative">
                                                <Input 
                                                    placeholder="Search mail..." 
                                                    className="h-8 w-full"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    autoFocus
                                                    onBlur={() => { if (!searchQuery) setIsSearching(false); }}
                                                />
                                            </div>
                                        ) : (
                                            <>
                                            {selectedEmails.length === 0 && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7"><FilterIcon className="h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {mailFilterOptions.slice(0, 5).map(filter => (
                                                            <DropdownMenuCheckboxItem key={filter} checked={activeMailFilter === filter} onSelect={() => setActiveMailFilter(filter)}>{filter}</DropdownMenuCheckboxItem>
                                                        ))}
                                                        <DropdownMenuSeparator />
                                                        {mailFilterOptions.slice(5).map(filter => (
                                                            <DropdownMenuCheckboxItem key={filter} checked={activeMailFilter === filter} onSelect={() => setActiveMailFilter(filter)}>{filter}</DropdownMenuCheckboxItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                             {selectedEmails.length === 0 ? (
                                                <>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><Star className="h-4 w-4" /></Button></TooltipTrigger>
                                                            <TooltipContent><p>Star</p></TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><Forward className="h-4 w-4" /></Button></TooltipTrigger>
                                                            <TooltipContent><p>Forward</p></TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </>
                                            ) : null}
                                            </>
                                        )}
                                    </>
                                )}
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
                            />
                        ) : (
                           filteredEmails.length === 0 ? renderEmptyState() :
                            <ScrollArea className="h-full">
                                <div className="p-2 space-y-0">
                                    {filteredEmails.slice(0, visibleEmailsCount).map((email) => {
                                        const sender = parseSender(email.senderName);
                                        const isSelected = selectedEmails.includes(email.id);
                                        return (
                                        <div
                                            key={email.id}
                                            onClick={() => handleSelectEmail(email)}
                                            className="group w-full text-left p-2 border-b transition-colors cursor-pointer hover:bg-muted/50"
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
                                                    <div className={cn("col-span-4", !email.read ? "font-semibold text-foreground" : "text-muted-foreground")}>
                                                        <div className="truncate text-sm flex items-center gap-2">
                                                            <span className="truncate">{sender.name}</span>
                                                        </div>
                                                        {sender.email && <p className="text-xs text-muted-foreground truncate">{sender.email}</p>}
                                                    </div>
                                                    <div className={cn("col-span-8 md:col-span-5 self-center flex items-center gap-2", !email.read ? "font-semibold text-foreground" : "text-muted-foreground")}>
                                                      <p className="truncate text-sm">{email.subject}</p>
                                                    </div>
                                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 h-full flex items-center gap-2">
                                                        <div className="flex items-center gap-2">
                                                            {email.isStarred && <Star className="h-4 w-4 text-yellow-500 shrink-0" />}
                                                            {email.isArchived && <Archive className="h-4 w-4 text-muted-foreground shrink-0" />}
                                                            {email.isSpam && <ShieldAlert className="h-4 w-4 text-destructive shrink-0" />}
                                                            {email.isBlocked && <Ban className="h-4 w-4 text-gray-500 shrink-0" />}
                                                        </div>
                                                        <span className="text-xs text-muted-foreground group-hover:hidden">{getReceivedDateTime(email.receivedAt)}</span>
                                                        <div className="hidden items-center gap-1 group-hover:flex">
                                                            <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><Star className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Star</p></TooltipContent></Tooltip></TooltipProvider>
                                                            <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><Forward className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Forward</p></TooltipContent></Tooltip></TooltipProvider>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-7 w-7 transition-opacity">
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                                                    <DropdownMenuItem><Archive className="mr-2 h-4 w-4" /> Archive</DropdownMenuItem>
                                                                    <DropdownMenuItem><Ban className="mr-2 h-4 w-4" /> Block</DropdownMenuItem>
                                                                    <DropdownMenuItem><ShieldAlert className="mr-2 h-4 w-4" /> Report Spam</DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )})}
                                     {visibleEmailsCount < filteredEmails.length && (
                                        <Button variant="outline" className="w-full mt-2" onClick={() => setVisibleEmailsCount(c => c + ITEMS_PER_PAGE)}>Load More</Button>
                                    )}
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
