
"use client";

import React, { createContext, useEffect, useState, ReactNode, useContext } from 'react';
import { useUser as useBasicUser } from '@/firebase/auth/use-user';
import type { UserProfile as BasicUserProfile } from '@/firebase/auth/use-user';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Plan } from '@/app/(admin)/admin/packages/data';
import { signInAnonymously, getAuth } from 'firebase/auth';
import type { Inbox } from '@/types';

const LOCAL_INBOX_KEY = "tempinbox_guest_inbox_id";

// This is the FULLY hydrated user profile, including the resolved plan and guest inbox.
export type UserProfile = BasicUserProfile & { plan: Plan | null, inbox?: Inbox | null };

// 1. Create a new context for the FULLY hydrated user profile.
interface AuthContextType {
  userProfile: UserProfile | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  userProfile: null,
  isLoading: true,
});

// Hook to easily consume the final, hydrated user profile.
export const useUser = () => useContext(AuthContext);

/**
 * AuthProvider is the application's master gatekeeper. It performs the full, multi-step
 * authentication and hydration process, providing a single, reliable UserProfile object
 * to the rest of the app via context.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // Step 1: Get the basic user object (auth state only) from the low-level hook.
  const { user: basicProfile, isUserLoading: isProfileLoading } = useBasicUser();
  const firestore = useFirestore();
  const [hydratedUserProfile, setHydratedUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const router = useRouter();
  const pathname = usePathname();

  const isAdminRoute = pathname.startsWith('/admin');
  const isLoginPage = pathname === '/login';
  const isAdminLoginPage = pathname === '/login/admin';

  useEffect(() => {
    const hydrateProfile = async () => {
      if (isProfileLoading || !firestore) {
        return;
      }
      
      const auth = getAuth();
      let finalProfile = basicProfile;

      // If no user is logged in at all, create an anonymous session.
      if (!finalProfile) {
        try {
            if (auth) {
                const userCredential = await signInAnonymously(auth);
                finalProfile = {
                    uid: userCredential.user.uid,
                    email: null,
                    isAnonymous: true,
                    planId: 'free-default', // Guests always use the default plan
                };
            }
        } catch (error) {
            console.error("Anonymous sign-in failed:", error);
            setIsLoading(false);
            return;
        }
      }

      if (!finalProfile) {
          setIsLoading(false);
          return;
      }

      // Determine the plan to fetch.
      const planIdToFetch = finalProfile.planId || 'free-default';
      
      try {
        const planRef = doc(firestore, 'plans', planIdToFetch);
        const planSnap = await getDoc(planRef);
        let planData: Plan | null = planSnap.exists() ? { id: planSnap.id, ...planSnap.data() } as Plan : null;
        
        // Fallback to free plan if the user's assigned plan doesn't exist.
        if (!planData && planIdToFetch !== 'free-default') {
          console.warn(`Plan '${planIdToFetch}' not found. Falling back to free plan.`);
          const freePlanRef = doc(firestore, 'plans', 'free-default');
          const freePlanSnap = await getDoc(freePlanRef);
          planData = freePlanSnap.exists() ? { id: freePlanSnap.id, ...freePlanSnap.data() } as Plan : null;
        }

        let inboxData: Inbox | null = null;
        if (finalProfile.isAnonymous) {
            const guestInboxId = localStorage.getItem(LOCAL_INBOX_KEY);
            if (guestInboxId) {
                 const inboxRef = doc(firestore, 'inboxes', guestInboxId);
                 const inboxSnap = await getDoc(inboxRef);
                 if (inboxSnap.exists()) {
                    inboxData = { id: inboxSnap.id, ...inboxSnap.data() } as Inbox;
                 }
            }
        }

        setHydratedUserProfile({ ...finalProfile, plan: planData, inbox: inboxData });
      } catch (error) {
        console.error("Error hydrating user profile with plan:", error);
        setHydratedUserProfile({ ...finalProfile, plan: null }); 
      } finally {
        setIsLoading(false);
      }
    };

    hydrateProfile();
  }, [isProfileLoading, basicProfile, firestore]);

  // Step 3: Enforce routing rules once the final profile is ready.
  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (isAdminRoute && !hydratedUserProfile?.isAdmin) {
      router.replace('/login/admin');
      return;
    }
    
    // Redirect logged-in (non-anonymous) users away from login pages
    if (hydratedUserProfile && !hydratedUserProfile.isAnonymous) {
      if (isLoginPage || (isAdminLoginPage && !hydratedUserProfile.isAdmin)) {
        router.replace(isAdminRoute ? '/admin' : '/');
      } else if (isAdminLoginPage && hydratedUserProfile.isAdmin) {
        router.replace('/admin');
      }
    }

  }, [isLoading, hydratedUserProfile, pathname, router, isAdminRoute, isLoginPage, isAdminLoginPage]);


  // Show the main loading screen while the multi-step hydration process is running.
  if (isLoading || isProfileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Initializing your secure session...</p>
        </div>
      </div>
    );
  }

  return (
      <AuthContext.Provider value={{ userProfile: hydratedUserProfile, isLoading }}>
        {children}
      </AuthContext.Provider>
  );
}
