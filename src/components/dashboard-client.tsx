
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
  Check,
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuPortal } from "./ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import Image from "next/image";
import { Separator } from "./ui/separator";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Progress } from "./ui/progress";


const LOCAL_INBOX_KEY = "tempinbox_guest_inbox";

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
  const [activeInbox, setActiveInbox] = useState<InboxType | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [countdown, setCountdown] = useState<{ [inboxId: string]: { total: number, remaining: number } }>({});
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
  const [customLifetime, setCustomLifetime] = useState({ count: 10, unit: 'minutes' });
  const [useCustomLifetime, setUseCustomLifetime] = useState(false);


  // Demo mode specific state
  const [activeDemoInbox, setActiveDemoInbox] = useState<InboxType | null>(demoInboxes[0]);

  const firestore = useFirestore();
  const { userProfile, isUserLoading } = useUser();
  const { toast } = useToast();
  
  const activePlan = userProfile?.plan;

  const allowedDomainsQuery = useMemoFirebase(() => {
    if (!firestore || !activePlan) return null;
    const tiers = activePlan.features.allowPremiumDomains ? ["free", "premium"] : ["free"];
    return query(collection(firestore, "allowed_domains"), where("tier", "in", tiers));
  }, [firestore, activePlan]);
  const { data: allowedDomains, isLoading: isLoadingDomains } = useCollection(allowedDomainsQuery);

  
  const userInboxesQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile?.uid || userProfile?.isAnonymous) return null;
    return query(collection(firestore, 'inboxes'), where('userId', '==', userProfile.uid), orderBy('createdAt', 'desc'));
  }, [firestore, userProfile?.uid, userProfile?.isAnonymous]);
  const { data: liveUserInboxes, isLoading: isLoadingInboxes } = useCollection<InboxType>(userInboxesQuery);

  const [localGuestInbox, setLocalGuestInbox] = useState<InboxType | null>(null);

  const userInboxes = useMemo(() => {
    if (userProfile?.isAnonymous) {
      return localGuestInbox ? [localGuestInbox] : [];
    }
    return liveUserInboxes || [];
  }, [userProfile?.isAnonymous, localGuestInbox, liveUserInboxes]);


  const emailsQuery = useMemoFirebase(() => {
    if (!firestore || !activeInbox?.id || !userProfile || userProfile.isAnonymous) return null;
    return query(
      collection(firestore, `inboxes/${activeInbox.id}/emails`),
      orderBy("receivedAt", "desc")
    );
  }, [firestore, activeInbox?.id, userProfile]);

  const { data: inboxEmails, isLoading: isLoadingEmails } = useCollection<Email>(emailsQuery);

  const displayedInboxes = useMemo(() => {
      if (isDemoMode) return demoInboxes;
      return userInboxes || [];
  }, [isDemoMode, userInboxes]);

  const filteredEmails = useMemo(() => {
    if (isDemoMode) {
      return demoEmails.filter(e => e.inboxId === activeDemoInbox?.id);
    }
    
    // For guests, emails are stored on the inbox object in local storage
    if (userProfile?.isAnonymous && activeInbox) {
      return (activeInbox as any).emails || [];
    }

    const sourceEmails = inboxEmails || [];
    
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
        return filtered.sort((a,b) => new Date(a.receivedAt as string).getTime() - new Date(b.receivedAt as string).getTime());
    }
    // New and All sort by newest first
    return filtered.sort((a,b) => new Date(b.receivedAt as string).getTime() - new Date(a.receivedAt as string).getTime());
  }, [isDemoMode, inboxEmails, activeDemoInbox, activeMailFilter, searchQuery, userProfile, activeInbox]);

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
    if (!selectedLifetime && activePlan && activePlan.features.availableInboxtimers?.length > 0) {
        const defaultLifetime = activePlan.features.availableInboxtimers.find(t => t.id !== 'custom');
        if (defaultLifetime) {
            setSelectedLifetime(`${defaultLifetime.count}_${defaultLifetime.unit}`);
        }
    }
  }, [allowedDomains, selectedDomain, activePlan, selectedLifetime]);

  useEffect(() => {
    // This effect handles setting the newly created inbox as active.
    if (isCreating && liveUserInboxes && liveUserInboxes.length > 0) {
        const newestInbox = liveUserInboxes[0]; // The query is ordered by createdAt desc
        if (!activeInbox || (newestInbox && newestInbox.id !== activeInbox.id)) {
            setActiveInbox(newestInbox);
            setIsCreating(false); // Creation process is complete now.
        }
    }
  }, [liveUserInboxes, isCreating, activeInbox]);

  const createNewInbox = useCallback(async () => {
    if (!firestore || !allowedDomains || !userProfile || !activePlan) {
      setServerError("Services not ready. Please try again in a moment.");
      return;
    }
    if (!prefixInput) {
      toast({ title: "Prefix Required", description: "Please enter a name for your inbox or use the 'Auto' button for a suggestion.", variant: "destructive" });
      return;
    }

    setIsCreating(true);
    setServerError(null);

    try {
      const domainToUse = selectedDomain || allowedDomains[0]?.domain;
      if (!domainToUse) throw new Error("No domains available.");

      const emailAddress = `${prefixInput}@${domainToUse}`;
      
      let lifetimeInMs;
      if (useCustomLifetime) {
          if(!activePlan.features.allowCustomtimer) {
               toast({ title: "Premium Feature", description: "Custom inbox timers are a premium feature.", variant: "destructive"});
               setIsCreating(false); return;
          }
           lifetimeInMs = customLifetime.count * (customLifetime.unit === 'minutes' ? 60 : (customLifetime.unit === 'hours' ? 3600 : 86400)) * 1000;
      } else {
          const selectedLt = activePlan.features.availableInboxtimers?.find(lt => `${lt.count}_${lt.unit}` === selectedLifetime);
          if (!selectedLt) throw new Error("Selected inbox timer is not valid.");
          if (selectedLt.isPremium && activePlan.planType !== 'pro') {
              toast({ title: "Premium Feature", description: "This inbox timer is a premium feature.", variant: "destructive"});
              setIsCreating(false); return;
          }
          const [count, unit] = selectedLifetime!.split('_');
          lifetimeInMs = parseInt(count) * (unit === 'minutes' ? 60 : (unit === 'hours' ? 3600 : 86400)) * 1000;
      }
      
      const expiresAt = new Date(Date.now() + lifetimeInMs);

      // Handle GUEST user (Local Storage)
      if (userProfile.isAnonymous) {
          const newInbox: InboxType = {
              id: `guest-${Date.now()}`,
              userId: userProfile.uid,
              emailAddress,
              domain: domainToUse,
              emailCount: 0,
              expiresAt: expiresAt.toISOString(),
              isStarred: false,
              isArchived: false,
              createdAt: Timestamp.now(),
              ...( { emails: [] } as any) 
          };
          localStorage.setItem(LOCAL_INBOX_KEY, JSON.stringify(newInbox));
          setLocalGuestInbox(newInbox);
          setActiveInbox(newInbox);
          setIsCreating(false); // Manually set for guests
      } 
      // Handle REGISTERED user (Firestore)
      else {
          const existingInboxQuery = query(collection(firestore, 'inboxes'), where('emailAddress', '==', emailAddress), limit(1));
          const existingInboxSnapshot = await getDocs(existingInboxQuery);
          if (!existingInboxSnapshot.empty) {
              throw new Error(`The email address '${emailAddress}' is already taken.`);
          }
          
          const newInboxData = {
              userId: userProfile.uid,
              emailAddress,
              domain: domainToUse,
              emailCount: 0,
              expiresAt: Timestamp.fromDate(expiresAt),
              createdAt: serverTimestamp(),
              isStarred: false,
              isArchived: false,
          };
          
          await addDoc(collection(firestore, `inboxes`), newInboxData);
          // The `useEffect` watching `liveUserInboxes` will now handle setting the active inbox and `isCreating` to false.
      }
      
      navigator.clipboard.writeText(emailAddress);
      toast({ title: "Created & Copied!", description: "New temporary email copied to clipboard." });
      setPrefixInput('');

    } catch (error: any) {
      toast({ title: "Creation Failed", description: error.message || "Could not generate a new email.", variant: "destructive" });
      setServerError(error.message);
      setIsCreating(false); // Ensure isCreating is reset on error
    } 
}, [firestore, allowedDomains, userProfile, activePlan, prefixInput, selectedDomain, useCustomLifetime, customLifetime, selectedLifetime, toast]);

  useEffect(() => {
    // This effect runs only once when the component mounts and userProfile is available.
    if (isUserLoading) return;
    const initializeSession = async () => {
        if (!userProfile || !firestore) return;

        let foundInbox: InboxType | null = null;

        if (userProfile.isAnonymous) {
            const localDataStr = localStorage.getItem(LOCAL_INBOX_KEY);
            if (localDataStr) {
                try {
                    const localData = JSON.parse(localDataStr);
                    if (new Date(localData.expiresAt) > new Date()) {
                        foundInbox = localData;
                        setLocalGuestInbox(foundInbox);
                    } else {
                        localStorage.removeItem(LOCAL_INBOX_KEY); // Clean up expired inbox
                    }
                } catch {
                    localStorage.removeItem(LOCAL_INBOX_KEY);
                }
            }
        } else {
            // For registered users, find their most recent active inbox.
            const q = query(
                collection(firestore, 'inboxes'),
                where('userId', '==', userProfile.uid),
                where('expiresAt', '>', Timestamp.now()),
                orderBy('expiresAt', 'desc'),
                limit(1)
            );
            const snap = await getDocs(q);
            if (!snap.empty) {
                const docData = snap.docs[0];
                foundInbox = {
                    id: docData.id,
                    ...docData.data(),
                    expiresAt: (docData.data().expiresAt as Timestamp).toDate().toISOString()
                } as InboxType;
            }
        }
        
        setActiveInbox(foundInbox);
        setIsLoading(false); // We have our initial state, stop loading.
    };

    initializeSession();
}, [userProfile, firestore, isUserLoading]);


  useEffect(() => {
    const intervalId = setInterval(() => {
        const newCountdown: { [inboxId: string]: { total: number; remaining: number } } = {};
        let activeInboxStillValid = false;

        userInboxes.forEach(inbox => {
            const expiryDate = new Date(inbox.expiresAt);
            const creationDate = inbox.createdAt instanceof Timestamp ? inbox.createdAt.toDate() : new Date(Date.parse(inbox.expiresAt) - 10 * 60000);
            const totalDuration = expiryDate.getTime() - creationDate.getTime();
            const remainingMs = expiryDate.getTime() - Date.now();

            if (remainingMs > 0) {
                newCountdown[inbox.id] = { total: totalDuration, remaining: remainingMs };
                if (activeInbox?.id === inbox.id) {
                    activeInboxStillValid = true;
                }
            } else {
                 if (userProfile?.isAnonymous && activeInbox?.id === inbox.id) {
                    localStorage.removeItem(LOCAL_INBOX_KEY);
                    setLocalGuestInbox(null);
                }
            }
        });

        setCountdown(newCountdown);
        if (activeInbox && !activeInboxStillValid) {
            setActiveInbox(null);
        }

    }, 1000);

    return () => clearInterval(intervalId);
}, [userInboxes, activeInbox, userProfile?.isAnonymous]);
  
  const handleCopyEmail = (email: string) => {
    if (email) {
      navigator.clipboard.writeText(email);
      toast({ title: "Copied!", description: "Email address copied to clipboard." });
    }
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
    if (!email.read && activeInbox && firestore && !isDemoMode && !userProfile?.isAnonymous) {
      try {
        const emailRef = doc(firestore, `inboxes/${activeInbox.id}/emails`, email.id);
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

  if (isLoading || isUserLoading || isLoadingDomains) {
    return (
      <Card className="min-h-[480px] flex flex-col items-center justify-center text-center p-8 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Initializing your secure inbox...</p>
      </Card>
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
  const canUseCustomTimer = activePlan.features.allowCustomtimer;
  
  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Header */}
       <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-center gap-4">
            <Card className="p-1.5 w-full h-14">
                <div className="flex items-center gap-2 h-full">
                        <Select value={useCustomLifetime ? 'custom' : selectedLifetime} onValueChange={(val) => {
                            if (val === 'custom') {
                                setUseCustomLifetime(true);
                            } else {
                                setUseCustomLifetime(false);
                                setSelectedLifetime(val);
                            }
                        }}>
                        <SelectTrigger className="w-auto border-0 bg-transparent h-full focus:ring-0 focus:ring-offset-0 px-2 group ml-1 mr-2 focus-visible:ring-0 focus-visible:ring-offset-0">
                            <Clock className="h-4 w-4 mr-2 text-muted-foreground group-hover:text-foreground transition-colors" />
                            <SelectValue placeholder="Inbox Timer" />
                        </SelectTrigger>
                        <SelectContent>
                            {(activePlan.features.availableInboxtimers || []).map(lt => {
                                if (lt.id === 'custom' && !canUseCustomTimer) return null;
                                if (lt.id === 'custom') return <SelectItem key="custom" value="custom">Custom</SelectItem>;
                                return (
                                    <SelectItem key={lt.id} value={`${lt.count}_${lt.unit}`} disabled={lt.isPremium && activePlan.planType !== 'pro'}>
                                        <span className="flex items-center">{lt.count} {lt.unit.charAt(0).toUpperCase() + lt.unit.slice(1)} {lt.isPremium && <Star className="h-3 w-3 ml-2 text-yellow-500 fill-yellow-500"/>}</span>
                                    </SelectItem>
                                )
                            })}
                        </SelectContent>
                    </Select>
                    
                        {useCustomLifetime && (
                        <div className="flex items-center gap-1 border-l pl-2">
                            <Input 
                                type="number" 
                                value={customLifetime.count} 
                                onChange={(e) => setCustomLifetime(prev => ({...prev, count: parseInt(e.target.value, 10) || 1}))}
                                className="w-20 h-full border-0 bg-transparent focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                            <Select value={customLifetime.unit} onValueChange={(unit) => setCustomLifetime(prev => ({...prev, unit: unit as 'minutes' | 'hours' | 'days'}))}>
                                <SelectTrigger className="w-auto border-0 bg-transparent focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-full">
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="minutes">Minutes</SelectItem>
                                    <SelectItem value="hours">Hours</SelectItem>
                                    <SelectItem value="days">Days</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        )}

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
                        <Button onClick={createNewInbox} disabled={isCreating} className="h-full ml-2">
                        {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Copy className="mr-2 h-4 w-4"/>}
                        Create
                    </Button>
                </div>
            </Card>
            
            <div className="flex items-center gap-2 justify-self-start md:justify-self-end">
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
                        src={`https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(activeInbox?.emailAddress || '')}`}
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
      <Card className="flex-1 flex flex-col h-full">
        <CardContent className="p-0 h-full flex-grow">
            {(filteredEmails.length === 0 && !isLoadingEmails && !isDemoMode) ? (
                 <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] h-full">
                    <div className="flex flex-col border-r h-full">{/* Left col for consistency */}</div>
                    {renderEmptyState()}
                 </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] h-full">
                    {/* Column 1: Inbox List */}
                    <div className="flex flex-col border-r h-full">
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
                        <ScrollArea className="h-full">
                            <div className="p-2 space-y-0">
                                {displayedInboxes.slice(0, visibleInboxesCount).map((inbox) => {
                                    const isSelected = selectedInboxes.includes(inbox.id);
                                    const isActive = isDemoMode ? activeDemoInbox?.id === inbox.id : activeInbox?.id === inbox.id;
                                    const inboxCountdown = countdown[inbox.id];
                                    const countdownMinutes = inboxCountdown ? Math.floor(inboxCountdown.remaining / 60000) : 0;
                                    const countdownSeconds = inboxCountdown ? Math.floor((inboxCountdown.remaining % 60000) / 1000) : 0;
                                    
                                    return (
                                    <div 
                                        key={inbox.id} 
                                        className={cn("p-2 group relative border-b cursor-pointer", isActive && "bg-muted")}
                                        onClick={() => {
                                            if (isDemoMode) {
                                                setActiveDemoInbox(inbox);
                                            } else {
                                                setActiveInbox(inbox);
                                            }
                                            setSelectedEmail(null);
                                        }}
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
                                                    {inbox.isStarred && <Star className="h-3 w-3 text-yellow-500" />}
                                                    {inbox.isArchived && <Archive className="h-3 w-3 text-muted-foreground shrink-0" />}
                                                  </div>
                                                  <div className="text-xs text-muted-foreground">
                                                      Expires: {`${String(countdownMinutes).padStart(2, '0')}:${String(countdownSeconds).padStart(2, '0')}`}
                                                  </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={isActive ? "default" : "secondary"} className={cn("transition-opacity", (isSelected || "group-hover:opacity-0"))}>{inbox.emailCount}</Badge>
                                                <TooltipProvider>
                                                    <div className={cn("absolute right-1 top-1/2 -translate-y-1/2 h-full flex items-center transition-opacity", isSelected || "opacity-0 group-hover:opacity-100")}>
                                                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleCopyEmail(inbox.emailAddress); }}><Copy className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Copy</p></TooltipContent></Tooltip>
                                                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}><QrCode className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>QR Code</p></TooltipContent></Tooltip>
                                                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}><Star className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Star</p></TooltipContent></Tooltip>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem><Download className="mr-2 h-4 w-4" />Export</DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem><Archive className="mr-2 h-4 w-4" />Archive</DropdownMenuItem>
                                                                <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </TooltipProvider>
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
                    <div className="flex flex-col h-full">
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
                           (isLoadingEmails && !isDemoMode) ? 
                           <div className="flex-grow flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div> :
                           (filteredEmails.length === 0 ? renderEmptyState() :
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
                                                            {email.isStarred && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                                                            {email.isArchived && <Archive className="h-3 w-3 text-muted-foreground shrink-0" />}
                                                            {email.isSpam && <ShieldAlert className="h-3 w-3 text-destructive shrink-0" />}
                                                            {email.isBlocked && <Ban className="h-3 w-3 text-gray-500 shrink-0" />}
                                                        </div>
                                                        {sender.email && <p className="text-xs text-muted-foreground truncate">{sender.email}</p>}
                                                    </div>
                                                    <div className={cn("col-span-8 md:col-span-5 self-center flex items-center gap-2", !email.read ? "font-semibold text-foreground" : "text-muted-foreground")}>
                                                      <p className="truncate text-sm">{email.subject}</p>
                                                    </div>
                                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 h-full flex items-center gap-2">
                                                        <span className="text-xs text-muted-foreground group-hover:hidden">{getReceivedDateTime(email.receivedAt)}</span>
                                                        <TooltipProvider>
                                                            <div className="hidden items-center gap-1 group-hover:flex">
                                                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><Star className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Star</p></TooltipContent></Tooltip>
                                                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><Forward className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Forward</p></TooltipContent></Tooltip>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-7 w-7 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem><Archive className="mr-2 h-4 w-4" /> Archive</DropdownMenuItem>
                                                                        <DropdownMenuItem><Ban className="mr-2 h-4 w-4" /> Block Sender</DropdownMenuItem>
                                                                        <DropdownMenuItem><ShieldAlert className="mr-2 h-4 w-4" /> Report Spam</DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </TooltipProvider>
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
                        ))}
                    </div>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

    