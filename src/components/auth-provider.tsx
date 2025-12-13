
"use client";

import React, { createContext, useEffect, useState, ReactNode, useContext } from 'react';
import { useUser as useBasicUser } from '@/firebase/auth/use-user';
import type { UserProfile } from '@/firebase/auth/use-user';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { useAuth, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Plan } from '@/app/(admin)/admin/packages/data';

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
  // Step 1: Get the basic user object (auth state only)
  const { user: authUser, isUserLoading: isAuthLoading } = useBasicUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const [hydratedUserProfile, setHydratedUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const router = useRouter();
  const pathname = usePathname();

  const isAdminRoute = pathname.startsWith('/admin');
  const isLoginPage = pathname === '/login';
  const isAdminLoginPage = pathname === '/login/admin';

  // Step 2: Handle anonymous sign-in if no user is present.
  useEffect(() => {
    if (auth && !authUser && !isAuthLoading) {
      initiateAnonymousSignIn(auth);
    }
  }, [auth, authUser, isAuthLoading]);

  // Step 3: Hydrate the basic profile with Firestore data and the correct plan.
  useEffect(() => {
    const hydrateProfile = async () => {
      // Wait for the basic auth user to be available.
      if (isAuthLoading || !authUser || !firestore) {
        return;
      }

      let profileData: any = { uid: authUser.uid, email: authUser.email, isAnonymous: authUser.isAnonymous };
      let planIdToFetch = 'free-default'; // Default for guests and new users

      // If the user is registered, fetch their document from Firestore.
      if (!authUser.isAnonymous) {
        const userDocRef = doc(firestore, 'users', authUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const dbData = userDocSnap.data();
          profileData = { ...profileData, ...dbData };
          if (dbData.planId) {
            planIdToFetch = dbData.planId;
          }
        }
      }
      
      try {
        // Fetch the determined plan.
        const planRef = doc(firestore, 'plans', planIdToFetch);
        const planSnap = await getDoc(planRef);
        let planData: Plan | null = planSnap.exists() ? { id: planSnap.id, ...planSnap.data() } as Plan : null;
        
        // If the user's assigned plan doesn't exist, fall back to the default free plan.
        if (!planData && planIdToFetch !== 'free-default') {
          console.warn(`Plan '${planIdToFetch}' not found. Falling back to free plan.`);
          const freePlanRef = doc(firestore, 'plans', 'free-default');
          const freePlanSnap = await getDoc(freePlanRef);
          planData = freePlanSnap.exists() ? { id: freePlanSnap.id, ...freePlanSnap.data() } as Plan : null;
        }

        // Create the final, fully hydrated profile object.
        const finalProfile = { ...profileData, plan: planData };
        setHydratedUserProfile(finalProfile);

      } catch (error) {
        console.error("Error hydrating user profile with plan:", error);
        setHydratedUserProfile({ ...profileData, plan: null }); 
      } finally {
        setIsLoading(false); // Hydration is complete (or failed). The app can now render.
      }
    };

    hydrateProfile();

  }, [isAuthLoading, authUser, firestore]);

  // Step 4: Enforce routing rules once the final profile is ready.
  useEffect(() => {
    if (isLoading || !hydratedUserProfile) {
      return; // Do nothing until hydration is complete.
    }

    if (isAdminRoute && !hydratedUserProfile?.isAdmin) {
      router.replace('/login/admin');
      return;
    }

    if (authUser && !authUser.isAnonymous && (isLoginPage || isAdminLoginPage)) {
      if (hydratedUserProfile?.isAdmin && isAdminLoginPage) {
         router.replace('/admin');
      } 
      else if (!isAdminRoute) {
         router.replace('/');
      }
      return;
    }

  }, [isLoading, authUser, hydratedUserProfile, pathname, router, isAdminRoute, isLoginPage, isAdminLoginPage]);


  // Show the main loading screen while the multi-step hydration process is running.
  if (isLoading || !hydratedUserProfile) {
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
