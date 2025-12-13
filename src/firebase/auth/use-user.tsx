
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
  const [isProfileAndPlanLoading, setProfileAndPlanLoading] = useState(true);

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

        setProfileAndPlanLoading(true);

        if (!user) { // Truly a guest, not logged in at all
            try {
                const planRef = doc(firestore, 'plans', 'free-default');
                const planSnap = await getDoc(planRef);
                const planData = planSnap.exists() ? { id: planSnap.id, ...planSnap.data() } as Plan : null;
                
                if (!planData) {
                    console.error("CRITICAL: The 'free-default' plan document was not found in Firestore.");
                }

                setUserProfileWithPlan({
                    uid: 'guest',
                    isAnonymous: true,
                    email: null,
                    plan: planData
                });
            } catch (error) {
                console.error("Error fetching guest plan:", error);
                setUserProfileWithPlan({ uid: 'guest', isAnonymous: true, email: null, plan: null });
            } finally {
                setProfileAndPlanLoading(false);
            }
            return;
        }

        // Handle authenticated user (anonymous or registered)
        let baseProfile: User | null = null;
        let planIdToFetch: string;

        if (user.isAnonymous) {
            planIdToFetch = 'free-default';
            baseProfile = { uid: user.uid, isAnonymous: true, email: null };
        } else {
            if (isLoadingProfileDoc) {
                return; // Wait for profile doc to load for registered user
            }
            baseProfile = userProfileData || { uid: user.uid, email: user.email, displayName: user.displayName || '' };
            planIdToFetch = userProfileData?.planId || 'free-default';
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
                plan: planData,
            });

        } catch (error) {
            console.error("Error fetching user plan:", error);
            if (baseProfile) {
                setUserProfileWithPlan({ ...baseProfile, plan: null });
            }
        } finally {
            setProfileAndPlanLoading(false);
        }
    };

    fetchPlanAndMerge();

  }, [user, isAuthLoading, userProfileData, isLoadingProfileDoc, firestore]);
  
  const isOverallLoading = isAuthLoading || isProfileAndPlanLoading;

  return { 
    user, 
    userProfile: userProfileWithPlan, 
    isUserLoading: isOverallLoading,
    userError: userError 
  };
};
