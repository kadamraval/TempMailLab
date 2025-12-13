'use client';

import { useFirebase } from '../provider';
import type { UserHookResult } from '../provider';
import { useDoc, useMemoFirebase } from '..';
import type { User } from '@/types';
import { doc }from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { type Plan } from '@/app/(admin)/admin/packages/data';

// This is the hydrated user profile, including the resolved plan.
export type UserProfile = User & { plan: Plan | null };

export interface UserHookResultWithProfile extends UserHookResult {
  // This is the basic user profile from Firestore, WITHOUT the plan.
  basicUserProfile: User | null;
  isProfileLoading: boolean; 
}

/**
 * Hook for accessing a user's basic authentication and Firestore profile data.
 * It does NOT resolve the plan. That is handled by the AuthProvider.
 */
export const useUser = (): UserHookResultWithProfile => {
  // Get the base authentication state from the main Firebase provider.
  const { user: authUser, isUserLoading: isAuthLoading, userError } = useFirebase();
  
  // Memoize the reference to the user's document in Firestore.
  const userProfileRef = useMemoFirebase(() => {
    if (!authUser?.uid || authUser.isAnonymous) return null;
    const firestore = useFirebase().firestore;
    return doc(firestore, 'users', authUser.uid);
  }, [authUser?.uid, authUser?.isAnonymous]);

  // useDoc hook to fetch the registered user's profile from Firestore.
  const { data: userProfileData, isLoading: isLoadingProfileDoc } = useDoc<User>(userProfileRef);
  
  const [basicUserProfile, setBasicUserProfile] = useState<User | null>(null);

  useEffect(() => {
    if (isAuthLoading) {
        return; // Wait for Firebase auth to be ready.
    }
    if (!authUser) {
        setBasicUserProfile(null); // No user logged in.
        return;
    }
    // If the user is anonymous, create a simple local profile immediately.
    if (authUser.isAnonymous) {
        setBasicUserProfile({
            uid: authUser.uid,
            isAnonymous: true,
            email: null,
            // The planId defaults to free-default, which AuthProvider will fetch.
            planId: 'free-default'
        });
    } else {
        // If the user is registered, use the data fetched from their Firestore doc.
        if (!isLoadingProfileDoc && userProfileData) {
            setBasicUserProfile({ ...authUser, ...userProfileData });
        }
    }
  }, [authUser, isAuthLoading, userProfileData, isLoadingProfileDoc]);

  // The overall loading state depends on both auth and the Firestore doc read for registered users.
  const isProfileLoading = isAuthLoading || (!authUser?.isAnonymous && isLoadingProfileDoc);
  
  return { 
    user: authUser, 
    basicUserProfile, 
    isUserLoading: isProfileLoading,
    isProfileLoading,
    userError
  };
};
