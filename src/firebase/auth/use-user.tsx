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
  const [isPlanLoading, setIsPlanLoading] = useState(true);

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid || user.isAnonymous) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid, user?.isAnonymous]);

  const { data: userProfileData, isLoading: isLoadingProfileDoc } = useDoc<User>(userProfileRef);

  useEffect(() => {
    const fetchPlanAndMerge = async () => {
        if (isAuthLoading || !firestore) {
            return;
        }
        
        setIsPlanLoading(true);

        let planIdToFetch: string;
        let baseProfile: User | null = null;

        if (user) { // User is authenticated (either anonymous or registered)
            if (user.isAnonymous) {
                planIdToFetch = 'free-default';
                baseProfile = user;
            } else {
                 if (isLoadingProfileDoc) {
                    return; // Wait for the profile document to load for registered users
                }
                if (userProfileData) {
                    baseProfile = userProfileData;
                    planIdToFetch = userProfileData.planId || 'free-default';
                } else {
                    // Registered user but no profile yet (e.g., during sign-up race condition).
                    // Default to free plan for now.
                    planIdToFetch = 'free-default';
                    baseProfile = user;
                }
            }
        } else { // No user is logged in at all (truly a guest)
             planIdToFetch = 'free-default';
             baseProfile = null;
        }
        
        try {
            const planRef = doc(firestore, 'plans', planIdToFetch);
            const planSnap = await getDoc(planRef);
            const planData = planSnap.exists() ? { id: planSnap.id, ...planSnap.data() } as Plan : null;

            if (!planData && planIdToFetch === 'free-default') {
                console.error("CRITICAL: The 'free-default' plan document was not found in Firestore.");
            }

            if (baseProfile) {
                 setUserProfileWithPlan({
                    ...baseProfile,
                    plan: planData
                });
            } else {
                // For a true guest, we still create a profile object with the plan
                 setUserProfileWithPlan({
                    uid: 'guest',
                    isAnonymous: true,
                    email: null,
                    plan: planData
                });
            }

        } catch (error) {
            console.error("Error fetching user plan:", error);
            if (baseProfile) {
                setUserProfileWithPlan({ ...baseProfile, plan: null });
            } else {
                setUserProfileWithPlan({ uid: 'guest', isAnonymous: true, email: null, plan: null });
            }
        } finally {
            setIsPlanLoading(false);
        }
    };

    fetchPlanAndMerge();

  }, [user, isAuthLoading, userProfileData, isLoadingProfileDoc, firestore]);
  
  const isOverallLoading = isAuthLoading || isPlanLoading;

  return { 
    user, 
    userProfile: userProfileWithPlan, 
    isUserLoading: isOverallLoading,
    userError: userError 
  };
};
