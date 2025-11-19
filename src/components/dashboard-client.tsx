
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
  Mail,
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
} from 'firebase/firestore';
import { fetchEmailsWithCredentialsAction } from '@/lib/actions/mailgun';
import { type Plan } from '@/app/(admin)/admin/packages/data';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { signInAnonymously } from 'firebase/auth';
import { v4 as uuidv4 } from 'uuid';

const LOCAL_INBOX_KEY = 'tempinbox_anonymous_inbox';

export function DashboardClient() {
  const [currentInbox, setCurrentInbox] = useState<InboxType | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);

  const firestore = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading, userProfile } = useUser();
  const { toast } = useToast();

  const planId = userProfile?.planId || 'free-default';
  
  const userPlanRef = useMemoFirebase(() => {
    if (!firestore || !planId) return null;
    return doc(firestore, 'plans', planId);
  }, [firestore, planId]);

  const userInboxQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || isUserLoading || user.isAnonymous) return null;
    return query(collection(firestore, `inboxes`), where('userId', '==', user.uid));
  }, [firestore, user?.uid, isUserLoading, user?.isAnonymous]);
  
  const liveInboxDocRef = useMemoFirebase(() => {
    if (!firestore || !currentInbox) return null;
    return doc(firestore, 'inboxes', currentInbox.id);
  }, [firestore, currentInbox?.id]);
  
  const emailsQuery = useMemoFirebase(() => {
      if (!firestore || !currentInbox?.id) return null;
      return query(collection(firestore, `inboxes/${currentInbox.id}/emails`));
  }, [firestore, currentInbox?.id]);

  const { data: activePlan, isLoading: isLoadingPlan } = useDoc<Plan>(userPlanRef);
  const { data: userInboxes, isLoading: isLoadingInboxes } = useCollection<InboxType>(userInboxQuery);
  const { data: liveInbox } = useDoc<InboxType>(liveInboxDocRef);
  const { data: inboxEmails, isLoading: isLoadingEmails } = useCollection<Email>(emailsQuery);

  const sortedEmails = useMemo(() => {
      if (!inboxEmails) return [];
      return [...inboxEmails].sort((a, b) => {
          const timeA = a.receivedAt instanceof Timestamp ? a.receivedAt.toMillis() : new Date(a.receivedAt).getTime();
          const timeB = b.receivedAt instanceof Timestamp ? b.receivedAt.toMillis() : new Date(b.receivedAt).getTime();
          return timeB - timeA;
      });
  }, [inboxEmails]);

  // Effect to load existing session from local storage or database on initial load
  useEffect(() => {
    const initializeSession = async () => {
        if (isUserLoading || !auth) return;

        let activeUser = user;
        // Ensure anonymous user exists
        if (!activeUser) {
            try {
                const userCredential = await signInAnonymously(auth);
                activeUser = userCredential.user;
            } catch (error) {
                console.error("Anonymous sign-in failed", error);
                setServerError("Could not start a session. Please refresh the page.");
                return;
            }
        }
        if (!activeUser) return;

        // For anonymous users, check local storage first
        if (activeUser.isAnonymous) {
            const localDataStr = localStorage.getItem(LOCAL_INBOX_KEY);
            if (localDataStr) {
                try {
                    const localData = JSON.parse(localDataStr);
                    if (new Date(localData.expiresAt) > new Date()) {
                        const inboxDoc = await getDoc(doc(firestore, 'inboxes', localData.id));
                        if (inboxDoc.exists()) {
                            setCurrentInbox({ id: inboxDoc.id, ...inboxDoc.data() } as InboxType);
                            return;
                        }
                    }
                } catch {
                    localStorage.removeItem(LOCAL_INBOX_KEY);
                }
            }
        } else if (userInboxes && userInboxes.length > 0) {
            // For registered users, check their database inboxes
            const activeDbInbox = userInboxes.find(ib => new Date(ib.expiresAt) > new Date());
            if (activeDbInbox) {
                setCurrentInbox(activeDbInbox);
            }
        }
    };
    
    if (!isUserLoading && !isLoadingInboxes) {
        initializeSession();
    }
  }, [user, isUserLoading, auth, firestore, isLoadingInboxes, userInboxes]);

  const handleRefresh = useCallback(async () => {
    if (!currentInbox?.emailAddress || !currentInbox.id || !auth) return;

    setIsRefreshing(true);
    setServerError(null);
    
    let ownerToken: string | undefined = undefined;
    if (auth.currentUser?.isAnonymous) {
      const localData = localStorage.getItem(LOCAL_INBOX_KEY);
      ownerToken = localData ? JSON.parse(localData).ownerToken : undefined;
    }

    try {
      const result = await fetchEmailsWithCredentialsAction(
        currentInbox.emailAddress,
        currentInbox.id,
        ownerToken
      );

      if (result.error) {
        setServerError(result.error);
      } else {
        setServerError(null);
      }
    } catch (error: any) {
      setServerError(error.message);
    } finally {
      setIsRefreshing(false);
    }
  }, [currentInbox?.id, currentInbox?.emailAddress, auth]);
  
   const handleGenerateNewInbox = async () => {
        if (isGenerating || !firestore || !activePlan || !auth) return;
        
        let activeUser = auth.currentUser;
        if (!activeUser) {
            try {
                const cred = await signInAnonymously(auth);
                activeUser = cred.user;
            } catch (e) {
                 setServerError("Could not create a user session. Please try again.");
                 return;
            }
        }
        
        setIsGenerating(true);
        setServerError(null);
        setCurrentInbox(null);
        setSelectedEmail(null);

        const domainsQuery = query(
          collection(firestore, 'allowed_domains'),
          where('tier', 'in', activePlan.features.allowPremiumDomains ? ['free', 'premium'] : ['free'])
        );

        try {
            const domainsSnapshot = await getDocs(domainsQuery);
            if (domainsSnapshot.empty) {
                throw new Error('No domains configured by administrator.');
            }

            const allowedDomains = domainsSnapshot.docs.map((doc) => doc.data().domain as string);
            const randomDomain = allowedDomains[Math.floor(Math.random() * allowedDomains.length)];
            const emailAddress = `${generateRandomString(12)}@${randomDomain}`;
            
            const expiresAt = new Date(Date.now() + (activePlan.features.inboxLifetime || 10) * 60 * 1000);
            
            const newInboxData: Omit<InboxType, 'id' | 'createdAt'> = {
                userId: activeUser.uid,
                emailAddress,
                expiresAt: expiresAt.toISOString(),
            };

            if (activeUser.isAnonymous) {
                newInboxData.ownerToken = uuidv4();
            }

            const newInboxRef = await addDoc(collection(firestore, `inboxes`), {
                ...newInboxData,
                createdAt: serverTimestamp(),
            });

            const newDocSnap = await getDoc(newInboxRef);
            if (newDocSnap.exists()) {
                const finalInbox = { id: newDocSnap.id, ...newDocSnap.data() } as InboxType;
                setCurrentInbox(finalInbox);

                if (activeUser.isAnonymous && finalInbox.ownerToken) {
                    localStorage.setItem(LOCAL_INBOX_KEY, JSON.stringify({
                        id: finalInbox.id,
                        ownerToken: finalInbox.ownerToken,
                        expiresAt: finalInbox.expiresAt,
                    }));
                }
            } else {
                throw new Error('Failed to create and retrieve the new inbox from the database.');
            }
        } catch (error: any) {
            setServerError(error.message || 'Could not generate a new email address.');
        } finally {
            setIsGenerating(false);
        }
    };
  
  useEffect(() => {
    const inboxToMonitor = liveInbox || currentInbox;
    let countdownInterval: NodeJS.Timeout | null = null;

    if (inboxToMonitor?.expiresAt) {
      const expiryDate = new Date(inboxToMonitor.expiresAt);
      
      const updateCountdown = () => {
        const newCountdown = Math.floor((expiryDate.getTime() - Date.now()) / 1000);
        if (newCountdown <= 0) {
          setCurrentInbox(null);
          setSelectedEmail(null);
          if (user?.isAnonymous) {
            localStorage.removeItem(LOCAL_INBOX_KEY);
          }
        } else {
          setCountdown(newCountdown);
        }
      };

      updateCountdown();
      countdownInterval = setInterval(updateCountdown, 1000);
    }

    return () => {
      if (countdownInterval) clearInterval(countdownInterval);
    };
  }, [liveInbox, currentInbox, user?.isAnonymous]);

  useEffect(() => {
    let autoRefreshInterval: NodeJS.Timeout | null = null;
    
    if (currentInbox?.id && !isGenerating) {
       autoRefreshInterval = setInterval(() => {
          if (!isRefreshing) {
            handleRefresh();
          }
       }, 15000); 
    }
    
    return () => {
      if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    };
  }, [currentInbox?.id, isRefreshing, isGenerating, handleRefresh]);


  const handleCopyEmail = async () => {
    if (currentInbox?.emailAddress) {
      navigator.clipboard.writeText(currentInbox.emailAddress);
      toast({ title: 'Copied!', description: 'Email address copied to clipboard.' });
    }
  };

  const handleDeleteCurrentInbox = async () => {
    if (currentInbox && firestore) {
      await deleteDoc(doc(firestore, 'inboxes', currentInbox.id));
      if (user?.isAnonymous) {
          localStorage.removeItem(LOCAL_INBOX_KEY);
      }
    }
    setCurrentInbox(null);
    setSelectedEmail(null);
  };

  const handleSelectEmail = async (email: Email) => {
    setSelectedEmail(email);
    if (!email.read && currentInbox && firestore) {
      const emailRef = doc(firestore, `inboxes/${currentInbox.id}/emails`, email.id);
      await updateDoc(emailRef, { read: true });
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };
  
  function generateRandomString(length: number) {
    let result = '';
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  if (isUserLoading || isLoadingPlan) {
    return (
      <div className="flex items-center justify-center min-h-[480px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!currentInbox) {
      return (
        <Card className="min-h-[480px] flex flex-col items-center justify-center text-center p-8 space-y-4">
            <Mail className="h-16 w-16 text-muted-foreground" />
            <h2 className="text-2xl font-semibold">Ready for a disposable email?</h2>
            <p className="text-muted-foreground max-w-sm">
                Click the button below to generate a new temporary email address. Keep your real inbox safe from spam.
            </p>
            <Button size="lg" onClick={handleGenerateNewInbox} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                {isGenerating ? 'Generating...' : 'Generate Temporary Email'}
            </Button>
            {serverError && (
                <Alert variant="destructive" className="mt-4 text-left">
                  <ServerCrash className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{serverError}</AlertDescription>
                </Alert>
            )}
        </Card>
      )
  }

  const displayEmail = currentInbox.emailAddress;

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
          <span className="truncate">{displayEmail}</span>
          <Copy className="h-4 w-4 ml-2 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isRefreshing}>
            {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
          <Button
            onClick={handleDeleteCurrentInbox}
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
          <AlertTitle>Action Failed</AlertTitle>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <div className="flex-1">
        <Card className="h-full">
          <CardContent className="p-0 h-full">
            <div className="grid grid-cols-1 md:grid-cols-[350px_1fr] h-full min-h-[calc(100vh-400px)]">
              <div className="flex flex-col border-r">
                <ScrollArea className="flex-1">
                  {isLoadingEmails && (!sortedEmails || sortedEmails.length === 0) ? (
                    <div className="flex-grow flex flex-col items-center justify-center text-center py-12 px-4 text-muted-foreground space-y-4 h-full">
                      <Inbox className="h-16 w-16 mb-4" />
                      <p className="mt-4 text-lg">Waiting for incoming emails...</p>
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {sortedEmails.map((email) => (
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
