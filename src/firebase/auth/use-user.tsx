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
        setIsProfileLoading(true);
        // If there's no user, we are done.
        if (!user) {
            setUserProfileWithPlan(null);
            setIsProfileLoading(false);
            return;
        }

        // Handle anonymous user separately and efficiently
        if (user.isAnonymous) {
            if (!firestore) return;
            const defaultPlanRef = doc(firestore, "plans", "free-default");
            const defaultPlanSnap = await getDoc(defaultPlanRef);
            const plan = defaultPlanSnap.exists() ? { id: defaultPlanSnap.id, ...defaultPlanSnap.data() } as Plan : null;
            setUserProfileWithPlan({ ...user, plan });
            setIsProfileLoading(false);
            return;
        }
        
        // Handle registered user
        if (userProfileData && firestore) {
            const planId = userProfileData.planId || 'free-default';
            const planRef = doc(firestore, 'plans', planId);
            const planSnap = await getDoc(planRef);
            const planData = planSnap.exists() ? { id: planSnap.id, ...planSnap.data() } as Plan : null;
            
            setUserProfileWithPlan({
                ...userProfileData,
                plan: planData
            });
            setIsProfileLoading(false);
        } else if (!isLoadingProfileDoc) {
             // If profile isn't loading but we don't have data (e.g., new registration), set loading to false.
             setIsProfileLoading(false);
        }
    };

    // Run this logic only when auth is resolved and we have a firestore instance
    if (!isAuthLoading && firestore) {
      fetchPlanAndMerge();
    }

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
