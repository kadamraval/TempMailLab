
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
 * Hook for accessing the authenticated user's state and their Firestore profile with the active plan merged.
 */
export const useUser = (): UserHookResultWithProfile => {
  const { user, isUserLoading: isAuthLoading, userError } = useFirebase();
  const firestore = useFirestore();
  
  const [userProfileWithPlan, setUserProfileWithPlan] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid || user.isAnonymous) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid, user?.isAnonymous]);

  const { data: userProfileData, isLoading: isLoadingProfileDoc } = useDoc<User>(userProfileRef);

  useEffect(() => {
    const fetchPlanAndMerge = async () => {
        // Don't do anything until auth is resolved and we have a firestore instance
        if (isAuthLoading || !firestore) {
            return;
        }
        
        setIsProfileLoading(true);

        if (!user) {
            setUserProfileWithPlan(null);
            setIsProfileLoading(false);
            return;
        }

        let planIdToFetch: string;
        let baseProfile: User;

        if (user.isAnonymous) {
            planIdToFetch = 'free-default';
            baseProfile = user as User;
        } else {
            if (isLoadingProfileDoc) {
                // If the registered user's profile is still loading, we can't proceed.
                return;
            }
            if (userProfileData) {
                baseProfile = userProfileData;
                planIdToFetch = userProfileData.planId || 'free-default';
            } else {
                // This can happen briefly during sign-up before the user doc is created.
                // We'll treat them as having the default plan in the meantime.
                baseProfile = user as User;
                planIdToFetch = 'free-default';
            }
        }
        
        try {
            const planRef = doc(firestore, 'plans', planIdToFetch);
            const planSnap = await getDoc(planRef);
            const planData = planSnap.exists() ? { id: planSnap.id, ...planSnap.data() } as Plan : null;

            if (!planData && planIdToFetch === 'free-default') {
                console.error("CRITICAL: The 'free-default' plan document was not found in Firestore.");
            }

            setUserProfileWithPlan({
                ...baseProfile,
                plan: planData
            });

        } catch (error) {
            console.error("Error fetching user plan:", error);
            // In case of error, create a profile with a null plan to avoid breaking the app
            setUserProfileWithPlan({ ...baseProfile, plan: null });
        } finally {
            setIsProfileLoading(false);
        }
    };

    fetchPlanAndMerge();

  }, [user, isAuthLoading, userProfileData, isLoadingProfileDoc, firestore]);
  
  // The final loading state depends on both auth and profile/plan loading
  const isOverallLoading = isAuthLoading || isProfileLoading;

  return { 
    user, 
    userProfile: userProfileWithPlan, 
    isUserLoading: isOverallLoading,
    userError: userError 
  };
};
