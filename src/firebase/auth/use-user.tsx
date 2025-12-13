
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
  // This loading state is specific to fetching the extended profile data.
  isProfileLoading: boolean; 
}

/**
 * Hook for accessing a user's extended Firestore profile with the active plan merged.
 * This hook correctly handles guests (anonymous users) and registered users.
 */
export const useUser = (): UserHookResultWithProfile => {
  // Get the base authentication state from the main Firebase provider.
  const { user: authUser, isUserLoading: isAuthLoading, userError } = useFirebase();
  const firestore = useFirestore();
  
  const [userProfileWithPlan, setUserProfileWithPlan] = useState<UserProfile | null>(null);
  // This hook's loading state is ONLY for fetching the Firestore profile.
  const [isProfileLoading, setProfileLoading] = useState(true);

  // Memoize the reference to the user's document in Firestore.
  // This ref will only exist if the user is registered (not a guest).
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  // useDoc hook to fetch the registered user's profile from Firestore.
  const { data: userProfileData, isLoading: isLoadingProfileDoc } = useDoc<User>(userProfileRef);

  useEffect(() => {
    // Wait until the initial Firebase Auth check is complete.
    if (isAuthLoading) {
      return;
    }
    
    // --- GUEST USER LOGIC ---
    // If there is no authenticated user, we treat them as a guest.
    if (!authUser) {
        const processGuestUser = async () => {
            if (!firestore) {
              setProfileLoading(false);
              return;
            }
            try {
                // Guests always get the 'free-default' plan.
                const planRef = doc(firestore, 'plans', 'free-default');
                const planSnap = await getDoc(planRef);
                const planData = planSnap.exists() ? { id: planSnap.id, ...planSnap.data() } as Plan : null;
                
                // Create a temporary, local user profile object for the guest.
                setUserProfileWithPlan({
                    uid: `guest_${Date.now()}`, // Create a temporary unique ID
                    isAnonymous: true,
                    email: null,
                    plan: planData
                });
            } catch (error) {
                console.error("Error fetching default plan for guest:", error);
                setUserProfileWithPlan({ uid: `guest_${Date.now()}`, isAnonymous: true, email: null, plan: null });
            } finally {
                // The guest profile is ready.
                setProfileLoading(false);
            }
        };
        processGuestUser();
        return; // End the effect for guest users.
    }

    // --- REGISTERED USER LOGIC ---
    // If we have a registered user but are still waiting for their Firestore document, keep loading.
    if (isLoadingProfileDoc) {
      setProfileLoading(true);
      return;
    }
    
    const processRegisteredUser = async () => {
        if (!firestore) return;

        // Base profile uses data from the auth object and merges data from the Firestore document.
        const baseProfile: User = { ...authUser, ...userProfileData };
        // Determine which plan to fetch: the one on their profile or the default.
        const planIdToFetch = userProfileData?.planId || 'free-default';
        
        try {
            const planRef = doc(firestore, 'plans', planIdToFetch);
            const planSnap = await getDoc(planRef);
            let planData: Plan | null = planSnap.exists() ? { id: planSnap.id, ...planSnap.data() } as Plan : null;

            // Fallback to free plan if the user's assigned plan doesn't exist for some reason.
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
            setProfileLoading(false); // The registered user's profile is ready.
        }
    };
    
    processRegisteredUser();

  }, [authUser, isAuthLoading, userProfileData, isLoadingProfileDoc, firestore]);
  
  return { 
    user: authUser, 
    userProfile: userProfileWithPlan, 
    // The main loading flag is true if either the initial auth check OR the profile fetch is running.
    isUserLoading: isAuthLoading || isProfileLoading,
    isProfileLoading: isProfileLoading,
    userError: userError 
  };
};
