
'use client';

import { useFirebase } from '../provider';
import type { UserHookResult } from '../provider';
import { useDoc, useMemoFirebase, useFirestore } from '..';
import type { User } from '@/types';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { type Plan } from '@/app/(admin)/admin/packages/data';

// This is the user profile from the `users` collection.
// It directly uses the `User` type from our central types file, but now includes the resolved plan.
export type UserProfile = User & { plan: Plan | null };

export interface UserHookResultWithProfile extends UserHookResult {
  userProfile: UserProfile | null;
}

/**
 * Hook for accessing a LOGGED-IN user's Firestore profile with the active plan merged.
 * This hook is now specifically for REGISTERED users. Guest handling is done in the AuthProvider.
 */
export const useUser = (): UserHookResultWithProfile => {
  const { user: authUser, isUserLoading: isAuthLoading, userError } = useFirebase();
  const firestore = useFirestore();
  
  const [userProfileWithPlan, setUserProfileWithPlan] = useState<UserProfile | null>(null);
  // This hook's loading state is only concerned with fetching the profile *after* auth is confirmed.
  const [isProfileLoading, setProfileLoading] = useState(true);

  const userProfileRef = useMemoFirebase(() => {
    // Only create a ref if we have a logged-in (non-anonymous) user.
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  // The useDoc hook will fetch the user's document from Firestore.
  const { data: userProfileData, isLoading: isLoadingProfileDoc } = useDoc<User>(userProfileRef);

  useEffect(() => {
    // If the main auth check is still running, or if there's no logged-in user, do nothing.
    if (isAuthLoading || !authUser) {
      setProfileLoading(false); // Not loading a profile if there's no user.
      setUserProfileWithPlan(null); // Ensure profile is null.
      return;
    }

    // If we have an authenticated user but are still waiting for their Firestore doc, wait.
    if (isLoadingProfileDoc) {
      setProfileLoading(true);
      return;
    }

    const processRegisteredUser = async () => {
        // At this point, authUser is guaranteed to be a registered user.
        const baseProfile: User = userProfileData || { uid: authUser.uid, email: authUser.email, displayName: authUser.displayName || '', isAnonymous: false };
        const planIdToFetch = userProfileData?.planId || 'free-default';
        
        try {
            if (!firestore) throw new Error("Firestore not available");
            const planRef = doc(firestore, 'plans', planIdToFetch);
            const planSnap = await getDoc(planRef);
            let planData: Plan | null = planSnap.exists() ? { id: planSnap.id, ...planSnap.data() } as Plan : null;

            // Fallback to free plan if the user's assigned plan doesn't exist
            if (!planData && planIdToFetch !== 'free-default') {
                 console.warn(`Plan '${planIdToFetch}' not found for user ${authUser.uid}. Falling back to free plan.`);
                 const freePlanRef = doc(firestore, 'plans', 'free-default');
                 const freePlanSnap = await getDoc(freePlanRef);
                 planData = freePlanSnap.exists() ? { id: freePlanSnap.id, ...freePlanSnap.data() } as Plan : null;
            }
            
            setUserProfileWithPlan({ ...baseProfile, plan: planData });

        } catch (error) {
            console.error("Error fetching user plan:", error);
            setUserProfileWithPlan({ ...baseProfile, plan: null }); // Set profile with null plan on error
        } finally {
            setProfileLoading(false); // Profile fetching is complete
        }
    };
    
    processRegisteredUser();

  }, [authUser, isAuthLoading, userProfileData, isLoadingProfileDoc, firestore]);
  
  return { 
    user: authUser, 
    userProfile: userProfileWithPlan, 
    // The overall loading state combines the initial auth check with the profile fetch.
    isUserLoading: isAuthLoading || (!!authUser && isProfileLoading),
    userError: userError 
  };
};
