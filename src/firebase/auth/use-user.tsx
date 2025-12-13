
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
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: userProfileData, isLoading: isLoadingProfileDoc } = useDoc<User>(userProfileRef);

  useEffect(() => {
    // This is the core logic change. We do not proceed until the initial auth check is complete.
    if (isAuthLoading) {
      return;
    }

    const fetchPlanAndMerge = async () => {
        setProfileAndPlanLoading(true);

        // Handle GUEST user (not logged into Firebase)
        if (!user) {
            try {
                if (!firestore) throw new Error("Firestore service not available.");
                const planRef = doc(firestore, 'plans', 'free-default');
                const planSnap = await getDoc(planRef);
                const planData = planSnap.exists() ? { id: planSnap.id, ...planSnap.data() } as Plan : null;
                
                if (!planData) {
                    console.error("CRITICAL: The 'free-default' plan document was not found in Firestore.");
                }

                // Create a temporary, in-memory profile for the guest
                setUserProfileWithPlan({
                    uid: 'guest-' + Date.now(), // Create a transient ID
                    isAnonymous: true,
                    email: null,
                    plan: planData
                });
            } catch (error) {
                console.error("Error fetching guest plan:", error);
                // Still provide a fallback profile to avoid breaking the UI
                setUserProfileWithPlan({ uid: 'guest-' + Date.now(), isAnonymous: true, email: null, plan: null });
            } finally {
                setProfileAndPlanLoading(false);
            }
            return;
        }

        // Handle REGISTERED user
        // Wait for their profile document from Firestore to load
        if (isLoadingProfileDoc) {
            return; 
        }
        
        // At this point, we have a logged-in user and their profile doc has been loaded (or is confirmed not to exist)
        const baseProfile: User = userProfileData || { uid: user.uid, email: user.email, displayName: user.displayName || '' };
        const planIdToFetch = userProfileData?.planId || 'free-default';
        
        try {
            const planRef = doc(firestore, 'plans', planIdToFetch);
            const planSnap = await getDoc(planRef);
            let planData: Plan | null = planSnap.exists() ? { id: planSnap.id, ...planSnap.data() } as Plan : null;

            // Fallback to free plan if the user's assigned plan doesn't exist
            if (!planData && planIdToFetch !== 'free-default') {
                 console.warn(`Plan '${planIdToFetch}' not found for user ${user.uid}. Falling back to free plan.`);
                 const freePlanRef = doc(firestore, 'plans', 'free-default');
                 const freePlanSnap = await getDoc(freePlanRef);
                 planData = freePlanSnap.exists() ? { id: freePlanSnap.id, ...freePlanSnap.data() } as Plan : null;
            }
            
            setUserProfileWithPlan({ ...baseProfile, plan: planData });

        } catch (error) {
            console.error("Error fetching user plan:", error);
            setUserProfileWithPlan({ ...baseProfile, plan: null });
        } finally {
            setProfileAndPlanLoading(false);
        }
    };

    fetchPlanAndMerge();

  }, [user, isAuthLoading, userProfileData, isLoadingProfileDoc, firestore]);
  
  // The overall loading state is true if either the auth check is running OR the profile/plan fetch is running.
  const isOverallLoading = isAuthLoading || isProfileAndPlanLoading;

  return { 
    user, 
    userProfile: userProfileWithPlan, 
    isUserLoading: isOverallLoading,
    userError: userError 
  };
};
