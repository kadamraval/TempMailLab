
"use client";

import React, { createContext, useEffect, useState, ReactNode } from 'react';
import { useUser as useAuthUser, UserProfile } from '@/firebase/auth/use-user';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { useAuth, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Plan } from '@/app/(admin)/admin/packages/data';

// 1. Create a new context for the hydrated user profile
interface AuthContextType {
  userProfile: UserProfile | null;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  userProfile: null,
  isLoading: true,
});

/**
 * AuthProvider is a client-side component that enforces authentication rules.
 * It is the single source of truth for loading states and redirection logic.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isUserLoading, basicUserProfile } = useAuthUser(); // Renamed to avoid confusion
  const auth = useAuth();
  const firestore = useFirestore();
  const [hydratedUserProfile, setHydratedUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
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
      setIsLoading(true);
      
      if (isUserLoading || !basicUserProfile) {
        return; // Wait for the basic profile to be loaded
      }

      // We have a profile (either guest or registered), now fetch the plan.
      const planIdToFetch = basicUserProfile.planId || 'free-default';
      
      try {
        const planRef = doc(firestore, 'plans', planIdToFetch);
        const planSnap = await getDoc(planRef);
        let planData: Plan | null = planSnap.exists() ? { id: planSnap.id, ...planSnap.data() } as Plan : null;
        
        if (!planData && planIdToFetch !== 'free-default') {
          console.warn(`Plan '${planIdToFetch}' not found. Falling back to free plan.`);
          const freePlanRef = doc(firestore, 'plans', 'free-default');
          const freePlanSnap = await getDoc(freePlanRef);
          planData = freePlanSnap.exists() ? { id: freePlanSnap.id, ...freePlanSnap.data() } as Plan : null;
        }

        const finalProfile = { ...basicUserProfile, plan: planData };
        setHydratedUserProfile(finalProfile);

      } catch (error) {
        console.error("Error hydrating user profile with plan:", error);
        setHydratedUserProfile({ ...basicUserProfile, plan: null }); // Proceed with a null plan on error
      } finally {
        setIsLoading(false); // Hydration complete (or failed)
      }
    };

    hydrateProfile();

  }, [isUserLoading, basicUserProfile, firestore]);

  useEffect(() => {
    // Wait until the final profile is hydrated.
    if (isLoading || !hydratedUserProfile) {
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

  }, [isLoading, user, hydratedUserProfile, pathname, router, isAdminRoute, isLoginPage, isAdminLoginPage]);


  // Show loading screen while auth is resolving or profile is hydrating.
  if (isLoading || !hydratedUserProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Initializing your secure inbox...</p>
        </div>
      </div>
    );
  }

  // Once all checks pass, provide the final profile and render the application.
  return (
      <AuthContext.Provider value={{ userProfile: hydratedUserProfile, isLoading }}>
        {children}
      </AuthContext.Provider>
  );
}
