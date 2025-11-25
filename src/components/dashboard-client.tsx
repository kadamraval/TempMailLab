
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Copy,
  RefreshCw,
  Loader2,
  Clock,
  Trash2,
  Inbox,
  ServerCrash,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { type Email, type Inbox as InboxType } from '@/types';
import { EmailView } from '@/components/email-view';
import {
  useAuth,
  useFirestore,
  useUser,
  useMemoFirebase,
  useDoc,
  useCollection,
} from '@/firebase';
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
} from 'firebase/firestore';
import { type Plan } from '@/app/(admin)/admin/packages/data';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { signInAnonymously } from 'firebase/auth';

const LOCAL_INBOX_KEY = 'tempinbox_anonymous_inbox';

export function DashboardClient() {
  const [currentInbox, setCurrentInbox] = useState<InboxType | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);

  const firestore = useFirestore();
  const auth = useAuth();
  const { user, userProfile, isUserLoading } = useUser();
  const { toast } = useToast();

  const planRef = useMemoFirebase(() => {
    if (!firestore || !user) return null; 
    const planId = userProfile?.planId || 'free-default';
    return doc(firestore, 'plans', planId);
  }, [firestore, user, userProfile]);

  const { data: activePlan, isLoading: isLoadingPlan } = useDoc<Plan>(planRef);
  
  const emailsQuery = useMemoFirebase(() => {
    if (!firestore || !currentInbox?.id || !user) return null;
    return query(collection(firestore, `inboxes/${currentInbox.id}/emails`), orderBy("receivedAt", "desc"));
  }, [firestore, currentInbox?.id, user]);

  const { data: inboxEmails, isLoading: isLoadingEmails } = useCollection<Email>(emailsQuery);

  const sortedEmails = useMemo(() => {
      if (!inboxEmails) return [];
      return inboxEmails;
  }, [inboxEmails]);

  const generateRandomString = (length: number) => {
    let result = '';
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const generateNewInbox = useCallback(async (activeUser: import('firebase/auth').User, plan: Plan) => {
    if (!firestore) {
        setServerError("Services not ready. Please try again in a moment.");
        return null;
    }

    setIsLoading(true);
    setServerError(null);

    const domainsQuery = query(
      collection(firestore, 'allowed_domains'),
      where('tier', 'in', plan.features.allowPremiumDomains ? ['free', 'premium'] : ['free'])
    );

    try {
        const domainsSnapshot = await getDocs(domainsQuery);
        if (domainsSnapshot.empty) throw new Error('No domains are configured by the administrator.');

        const allowedDomains = domainsSnapshot.docs.map((doc) => doc.data().domain as string);
        const randomDomain = allowedDomains[Math.floor(Math.random() * allowedDomains.length)];
        const emailAddress = `${generateRandomString(12)}@${randomDomain}`;
        
        const expiresAt = new Date(Date.now() + (plan.features.inboxLifetime || 10) * 60 * 1000);
        
        const newInboxData = {
            userId: activeUser.uid,
            emailAddress,
            domain: randomDomain,
            emailCount: 0,
            expiresAt: Timestamp.fromDate(expiresAt),
            createdAt: serverTimestamp(),
        };
        
        const newInboxRef = await addDoc(collection(firestore, `inboxes`), newInboxData);
        const newInbox = { id: newInboxRef.id, ...newInboxData, expiresAt: expiresAt.toISOString() } as InboxType;

        if (activeUser.isAnonymous) {
             localStorage.setItem(LOCAL_INBOX_KEY, JSON.stringify({ id: newInbox.id, expiresAt: newInbox.expiresAt }));
        }
        return newInbox;

    } catch (error: any) {
        setServerError(error.message || 'Could not generate a new email address.');
        return null;
    } finally {
        setIsLoading(false);
    }
  }, [firestore]);


  useEffect(() => {
    const initializeSession = async () => {
        if (isUserLoading || !auth || !firestore) return;

        let activeUser = user;
        let foundInbox: InboxType | null = null;

        // Step 1: Ensure we have a user (sign in anonymously if needed)
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

        // Step 2: Determine the plan
        let planToUse: Plan | null = activePlan;
        if (!planToUse && !isLoadingPlan) {
            const defaultPlanRef = doc(firestore, 'plans', 'free-default');
            const defaultPlanSnap = await getDoc(defaultPlanRef);
            if (defaultPlanSnap.exists()) {
                planToUse = { id: defaultPlanSnap.id, ...defaultPlanSnap.data() } as Plan;
            }
        }

        if (!planToUse) {
            if (!isLoadingPlan) {
                setServerError("Default plan 'free-default' not found. Please contact support.");
            }
            // If plan is still loading, just wait for the next render.
            return;
        }

        // Step 3: Try to find an existing inbox
        if (activeUser.isAnonymous) {
            const localDataStr = localStorage.getItem(LOCAL_INBOX_KEY);
            if (localDataStr) {
                try {
                    const localData = JSON.parse(localDataStr);
                    if (new Date(localData.expiresAt) > new Date()) {
                        const inboxDoc = await getDoc(doc(firestore, 'inboxes', localData.id));
                        if (inboxDoc.exists() && inboxDoc.data().userId === activeUser.uid) {
                            foundInbox = { id: inboxDoc.id, ...inboxDoc.data() } as InboxType;
                        }
                    }
                } catch { localStorage.removeItem(LOCAL_INBOX_KEY); }
            }
        } else { // Registered User
            const userInboxesQuery = query(
                collection(firestore, 'inboxes'), 
                where('userId', '==', activeUser.uid),
                orderBy('createdAt', 'desc'),
                limit(1)
            );
            const userInboxesSnap = await getDocs(userInboxesQuery);
            if (!userInboxesSnap.empty) {
                const latestInbox = { id: userInboxesSnap.docs[0].id, ...userInboxesSnap.docs[0].data() } as InboxType;
                 const expiry = latestInbox.expiresAt instanceof Timestamp ? latestInbox.expiresAt.toDate().toISOString() : latestInbox.expiresAt;
                if (new Date(expiry) > new Date()) {
                    foundInbox = { ...latestInbox, expiresAt: expiry };
                }
            }
        }
        
        // Step 4: If no valid inbox found, generate a new one
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
        const newCountdown = Math.floor((expiryDate.getTime() - Date.now()) / 1000);
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
      toast({ title: 'Copied!', description: 'Email address copied to clipboard.' });
    }
  };

  const handleDeleteAndRegenerate = async () => {
    if (!activePlan || !auth?.currentUser) return;
    setIsLoading(true);
    if (currentInbox && firestore) {
      await deleteDoc(doc(firestore, 'inboxes', currentInbox.id));
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

  const handleSelectEmail = async (email: Email) => {
    setSelectedEmail(email);
    if (!email.read && currentInbox && firestore) {
      try {
        const emailRef = doc(firestore, `inboxes/${currentInbox.id}/emails`, email.id);
        await updateDoc(emailRef, { read: true });
      } catch (error) {
        console.error("Failed to mark email as read:", error);
      }
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (isLoading) {
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
      )
  }
  
  if (!currentInbox) {
       return (
        <Card className="min-h-[480px] flex flex-col items-center justify-center text-center p-8 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Preparing your inbox...</p>
        </Card>
      )
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between gap-4 p-2 border bg-card text-card-foreground rounded-lg">
        <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{formatTime(countdown)}</span>
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
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
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

      <div className="flex-1 grid grid-cols-1 gap-4">
        <Card className="h-full">
          <CardContent className="p-0 h-full">
            <div className="grid grid-cols-1 md:grid-cols-[350px_1fr] h-full min-h-[calc(100vh-400px)]">
              <div className="flex flex-col border-r">
                <ScrollArea className="flex-1">
                  {isLoadingEmails && sortedEmails.length === 0 ? (
                     <div className="flex-grow flex flex-col items-center justify-center text-center py-12 px-4 text-muted-foreground space-y-4 h-full">
                      <Loader2 className="h-8 w-8 animate-spin" />
                       <p className="mt-4 text-lg">Checking for emails...</p>
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {sortedEmails.length === 0 ? (
                         <div className="flex-grow flex flex-col items-center justify-center text-center py-12 px-4 text-muted-foreground space-y-4 h-full">
                           <Inbox className="h-16 w-16 mb-4" />
                           <p className="mt-4 text-lg">Your inbox is empty.</p>
                           <p className="text-sm">New mail will appear here automatically when received.</p>
                         </div>
                      ) : sortedEmails.map((email) => (
                          <button
                            key={email.id}
                            onClick={() => handleSelectEmail(email)}
                            className={cn(
                              'w-full text-left p-3 rounded-md border-b border-transparent transition-colors flex items-center gap-4',
                              selectedEmail?.id === email.id ? 'bg-muted' : 'hover:bg-muted/50',
                              !email.read && 'font-semibold bg-card'
                            )}
                          >
                            <div
                              className={cn(
                                'h-2 w-2 rounded-full shrink-0',
                                !email.read ? 'bg-primary' : 'bg-transparent'
                              )}
                            ></div>
                            <div className="flex-grow overflow-hidden">
                              <div className="truncate font-medium">{email.senderName}</div>
                              <div
                                className={cn(
                                  'truncate text-sm',
                                  !email.read ? 'text-foreground' : 'text-muted-foreground'
                                )}
                              >
                                {email.subject}
                              </div>
                            </div>
                          </button>
                        ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
              <div className="col-span-1 hidden md:block">
                {selectedEmail ? (
                  <EmailView
                    email={{ ...selectedEmail, receivedAt: selectedEmail.receivedAt instanceof Timestamp ? selectedEmail.receivedAt.toDate().toISOString() : selectedEmail.receivedAt }}
                    plan={activePlan}
                    onBack={() => setSelectedEmail(null)}
                    showBackButton={false}
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground bg-card">
                    <Inbox className="h-16 w-16 mb-4" />
                    <h3 className="text-xl font-semibold">Select an email to read</h3>
                    <p>Your messages will appear here.</p>
                  </div>
                )}
              </div>
              {selectedEmail && (
                <div className="md:hidden absolute inset-0 bg-background z-10">
                  <EmailView
                     email={{ ...selectedEmail, receivedAt: selectedEmail.receivedAt instanceof Timestamp ? selectedEmail.receivedAt.toDate().toISOString() : selectedEmail.receivedAt }}
                    plan={activePlan}
                    onBack={() => setSelectedEmail(null)}
                    showBackButton={true}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    