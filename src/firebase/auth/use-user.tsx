
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
 * This hook is now designed to work for BOTH registered users and GUESTS.
 */
export const useUser = (): UserHookResultWithProfile => {
  // isAuthLoading is the source of truth for the initial Firebase auth check.
  const { user: authUser, isUserLoading: isAuthLoading, userError } = useFirebase();
  const firestore = useFirestore();
  
  const [userProfileWithPlan, setUserProfileWithPlan] = useState<UserProfile | null>(null);
  const [isProfileLoading, setProfileLoading] = useState(true);

  const userProfileRef = useMemoFirebase(() => {
    // Only create a ref if we have a logged-in (non-anonymous) user
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const { data: userProfileData, isLoading: isLoadingProfileDoc } = useDoc<User>(userProfileRef);

  useEffect(() => {
    // This effect's job is to create the final userProfile object once auth state is known.
    // It must not run until the initial Firebase auth check is complete.
    if (isAuthLoading) {
      return;
    }

    const processUser = async () => {
        setProfileLoading(true);

        // CASE 1: GUEST USER (authUser is null)
        if (!authUser) {
            try {
                if (!firestore) throw new Error("Firestore service not available.");
                // Fetch the essential 'free-default' plan for all guests.
                const planRef = doc(firestore, 'plans', 'free-default');
                const planSnap = await getDoc(planRef);
                const planData = planSnap.exists() ? { id: planSnap.id, ...planSnap.data() } as Plan : null;
                
                if (!planData) {
                    console.error("CRITICAL: The 'free-default' plan document was not found in Firestore.");
                }

                // Create a temporary, in-memory profile for the guest.
                // This user is "anonymous" in our app's logic, not Firebase's.
                setUserProfileWithPlan({
                    uid: 'guest-' + Date.now(),
                    isAnonymous: true, // This is our app-level flag.
                    email: null,
                    plan: planData
                });
            } catch (error) {
                console.error("Error fetching guest plan:", error);
                setUserProfileWithPlan({ uid: 'guest-' + Date.now(), isAnonymous: true, email: null, plan: null });
            } finally {
                setProfileLoading(false); // Guest session is now ready.
            }
            return;
        }

        // CASE 2: REGISTERED USER (authUser exists)
        // We need to wait for their profile document to be fetched from Firestore.
        if (isLoadingProfileDoc) {
            return; // Wait for the useDoc hook to finish.
        }
        
        // Now we have the authUser and their corresponding document data (or lack thereof).
        const baseProfile: User = userProfileData || { uid: authUser.uid, email: authUser.email, displayName: authUser.displayName || '', isAnonymous: false };
        const planIdToFetch = userProfileData?.planId || 'free-default';
        
        try {
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
            setUserProfileWithPlan({ ...baseProfile, plan: null });
        } finally {
            setProfileLoading(false); // Registered user session is now ready.
        }
    };

    processUser();

  }, [authUser, isAuthLoading, userProfileData, isLoadingProfileDoc, firestore]);
  
  // The overall loading state is true if either the auth check is running OR the profile/plan fetch is running.
  const isOverallLoading = isAuthLoading || isProfileLoading;

  return { 
    user: authUser, 
    userProfile: userProfileWithPlan, 
    isUserLoading: isOverallLoading,
    userError: userError 
  };
};
