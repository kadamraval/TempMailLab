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
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: userProfileData, isLoading: isLoadingProfileDoc } = useDoc<User>(userProfileRef);

  useEffect(() => {
    const fetchPlanAndMerge = async () => {
        if (!user || !userProfileData || !firestore) {
            // If the user is anonymous or there's no profile data yet, handle it.
            if (user?.isAnonymous && firestore) {
                 const defaultPlanRef = doc(firestore, "plans", "free-default");
                 const defaultPlanSnap = await getDoc(defaultPlanRef);
                 if (defaultPlanSnap.exists()) {
                     setUserProfileWithPlan({ ...user, plan: { id: defaultPlanSnap.id, ...defaultPlanSnap.data() } as Plan });
                 }
            } else if (!user) {
                 setUserProfileWithPlan(null); // No user, so no profile
            }
            return;
        };
        
        // Determine the plan ID, defaulting to 'free-default'
        const planId = userProfileData.planId || 'free-default';
        const planRef = doc(firestore, 'plans', planId);
        
        try {
            const planSnap = await getDoc(planRef);
            const planData = planSnap.exists() ? { id: planSnap.id, ...planSnap.data() } as Plan : null;
            
            setUserProfileWithPlan({
                ...userProfileData,
                plan: planData
            });

        } catch (error) {
            console.error("Failed to fetch user plan:", error);
            // Set profile but with null plan in case of error
            setUserProfileWithPlan({
                ...userProfileData,
                plan: null
            });
        }
    };

    if (!isLoadingProfileDoc) {
      fetchPlanAndMerge().finally(() => setIsProfileLoading(false));
    }

  }, [user, userProfileData, isLoadingProfileDoc, firestore]);
  

  const combinedLoading = isAuthLoading || (user && isProfileLoading);
  
  // Final check for anonymous user if profile loading is complete but no profile was found
  useEffect(() => {
    if (!combinedLoading && user && !userProfileWithPlan) {
      if (user.isAnonymous && firestore) {
        const loadDefaultPlan = async () => {
          const defaultPlanRef = doc(firestore, "plans", "free-default");
          const defaultPlanSnap = await getDoc(defaultPlanRef);
          if (defaultPlanSnap.exists()) {
            setUserProfileWithPlan({ ...user, plan: { id: defaultPlanSnap.id, ...defaultPlanSnap.data() } as Plan });
          }
        };
        loadDefaultPlan();
      }
    }
  }, [combinedLoading, user, userProfileWithPlan, firestore]);


  return { 
    user, 
    userProfile: userProfileWithPlan, 
    isUserLoading: combinedLoading,
    userError: userError 
  };
};
