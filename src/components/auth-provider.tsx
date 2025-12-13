
"use client";

import React, { useEffect, useState } from 'react';
import { useUser, UserProfile } from '@/firebase/auth/use-user';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { useAuth, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Plan } from '@/app/(admin)/admin/packages/data';

/**
 * AuthProvider is a client-side component that enforces authentication rules.
 * It is the single source of truth for loading states and redirection logic.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, userProfile, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const [hydratedUserProfile, setHydratedUserProfile] = useState<UserProfile | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);
  
  const router = useRouter();
  const pathname = usePathname();

  const isAdminRoute = pathname.startsWith('/admin');
  const isLoginPage = pathname === '/login';
  const isAdminLoginPage = pathname === '/login/admin';

  useEffect(() => {
    if (auth && !user && !isUserLoading) {
      initiateAnonymousSignIn(auth);
    }
  }, [auth, user, isUserLoading]);

  useEffect(() => {
    const hydrateProfile = async () => {
      if (isUserLoading || !userProfile) {
        setIsHydrating(true);
        return;
      }
      
      let finalProfile = { ...userProfile };

      // If the user is a guest and their plan hasn't been fetched yet, fetch it now.
      if (userProfile.isAnonymous && userProfile.plan === null) {
          const planRef = doc(firestore, 'plans', 'free-default');
          const planSnap = await getDoc(planRef);
          if (planSnap.exists()) {
              finalProfile.plan = { id: planSnap.id, ...planSnap.data() } as Plan;
          }
      }
      
      setHydratedUserProfile(finalProfile);
      setIsHydrating(false);
    };

    hydrateProfile();

  }, [isUserLoading, userProfile, firestore]);

  useEffect(() => {
    // Wait until the final profile is hydrated.
    if (isHydrating) {
      return;
    }

    if (isAdminRoute && !hydratedUserProfile?.isAdmin) {
      router.replace('/login/admin');
      return;
    }

    if (user && !user.isAnonymous && (isLoginPage || isAdminLoginPage)) {
      if (hydratedUserProfile?.isAdmin && isAdminLoginPage) {
         router.replace('/admin');
      } 
      else if (!isAdminRoute) {
         router.replace('/');
      }
      return;
    }

  }, [isHydrating, user, hydratedUserProfile, pathname, router, isAdminRoute, isLoginPage, isAdminLoginPage]);


  // Show loading screen while auth is resolving or profile is hydrating.
  if (isUserLoading || isHydrating || !hydratedUserProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Initializing your secure inbox...</p>
        </div>
      </div>
    );
  }

  // Once all checks pass, render the application.
  return <>{children}</>;
}

    