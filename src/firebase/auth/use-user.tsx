
'use client';

import { useFirebase } from '../provider';
import type { UserHookResult } from '../provider';
import { useDoc, useMemoFirebase, useFirestore } from '..';
import type { User } from '@/types';
import { doc, getDoc }from 'firebase/firestore';
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
    if (!firestore || !authUser?.uid || authUser.isAnonymous) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser?.uid, authUser?.isAnonymous]);

  // useDoc hook to fetch the registered user's profile from Firestore.
  const { data: userProfileData, isLoading: isLoadingProfileDoc } = useDoc<User>(userProfileRef);

  useEffect(() => {
    const resolveUserProfile = async () => {
        // Wait until the initial Firebase Auth check is complete.
        if (isAuthLoading) {
            setProfileLoading(true);
            return;
        }
    
        if (!authUser || authUser.isAnonymous) {
            // --- GUEST USER LOGIC ---
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
                    uid: authUser?.uid || `guest_${Date.now()}`,
                    isAnonymous: true,
                    email: null,
                    plan: planData
                });
            } catch (error) {
                console.error("Error fetching default plan for guest:", error);
                setUserProfileWithPlan({ uid: `guest_${Date.now()}`, isAnonymous: true, email: null, plan: null });
            } finally {
                setProfileLoading(false); // The guest profile is ready.
            }
        } else {
            // --- REGISTERED USER LOGIC ---
            if (isLoadingProfileDoc) {
                setProfileLoading(true);
                return;
            }

            if (!firestore) return;

            const baseProfile: User = { ...authUser, ...userProfileData };
            const planIdToFetch = userProfileData?.planId || 'free-default';
            
            try {
                const planRef = doc(firestore, 'plans', planIdToFetch);
                const planSnap = await getDoc(planRef);
                let planData: Plan | null = planSnap.exists() ? { id: planSnap.id, ...planSnap.data() } as Plan : null;

                // Fallback to free plan if the user's assigned plan doesn't exist.
                if (!planData && planIdToFetch !== 'free-default') {
                    console.warn(`Plan '${planIdToFetch}' not found. Falling back to free plan.`);
                    const freePlanRef = doc(firestore, 'plans', 'free-default');
                    const freePlanSnap = await getDoc(freePlanRef);
                    planData = freePlanSnap.exists() ? { id: freePlanSnap.id, ...freePlanSnap.data() } as Plan : null;
                }
                
                setUserProfileWithPlan({ ...baseProfile, plan: planData });

            } catch (error) {
                console.error("Error fetching user plan:", error);
                setUserProfileWithPlan({ ...baseProfile, plan: null });
            } finally {
                setProfileLoading(false);
            }
        }
    };
    
    resolveUserProfile();

  }, [authUser, isAuthLoading, userProfileData, isLoadingProfileDoc, firestore]);
  
  return { 
    user: authUser, 
    userProfile: userProfileWithPlan, 
    isUserLoading: isAuthLoading || isProfileLoading,
    isProfileLoading,
    userError
  };
};
