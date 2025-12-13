
'use client';

import { useFirebase } from '../provider';
import type { UserHookResult } from '../provider';
import { useDoc, useMemoFirebase } from '..';
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
  
  const [userProfileWithPlan, setUserProfileWithPlan] = useState<UserProfile | null>(null);
  const [isProfileLoading, setProfileLoading] = useState(true);

  // Memoize the reference to the user's document in Firestore.
  const userProfileRef = useMemoFirebase(() => {
    if (!authUser?.uid || authUser.isAnonymous) return null;
    const firestore = useFirebase().firestore;
    return doc(firestore, 'users', authUser.uid);
  }, [authUser?.uid, authUser?.isAnonymous]);

  // useDoc hook to fetch the registered user's profile from Firestore.
  const { data: userProfileData, isLoading: isLoadingProfileDoc } = useDoc<User>(userProfileRef);

  useEffect(() => {
    // We can only resolve the profile once the auth state is determined.
    if (isAuthLoading) {
        setProfileLoading(true);
        return;
    }

    if (!authUser || authUser.isAnonymous) {
        // --- GUEST USER LOGIC ---
        // For guests, we create a temporary, local profile object immediately.
        // We set the plan to null initially. The AuthProvider will be responsible
        // for fetching the real 'free-default' plan and merging it.
        setUserProfileWithPlan({
            uid: authUser?.uid || `guest_${Date.now()}`,
            isAnonymous: true,
            email: null,
            plan: null // The AuthProvider will fill this in.
        });
        setProfileLoading(false); // The guest profile is ready instantly.

    } else {
        // --- REGISTERED USER LOGIC ---
        if (isLoadingProfileDoc) {
            setProfileLoading(true);
            return;
        }

        const firestore = useFirebase().firestore;
        
        const baseProfile: User = { ...authUser, ...userProfileData };
        const planIdToFetch = userProfileData?.planId || 'free-default';
        
        // Asynchronously fetch the plan for the registered user.
        const fetchPlan = async () => {
             try {
                const planRef = doc(firestore, 'plans', planIdToFetch);
                const planSnap = await getDoc(planRef);
                let planData: Plan | null = planSnap.exists() ? { id: planSnap.id, ...planSnap.data() } as Plan : null;

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
        };

        fetchPlan();
    }

  }, [authUser, isAuthLoading, userProfileData, isLoadingProfileDoc]);
  
  return { 
    user: authUser, 
    userProfile: userProfileWithPlan, 
    isUserLoading: isAuthLoading || isProfileLoading,
    isProfileLoading,
    userError
  };
};

    