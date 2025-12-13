
'use client';

import { useFirebase } from '../provider';
import type { UserHookResult } from '../provider';
import { useDoc, useMemoFirebase } from '..';
import type { User } from '@/types';
import { doc }from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { type Plan } from '@/app/(admin)/admin/packages/data';

// This is now the FULL profile with the resolved plan.
export type UserProfile = User & { plan: Plan | null };

export interface UserHookResultWithProfile extends UserHookResult {
  // This is the basic user profile without the plan.
  basicUserProfile: User | null;
  isProfileLoading: boolean; 
}

/**
 * Hook for accessing a user's basic Firestore profile data.
 * The plan is now fetched separately by the AuthProvider.
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
        return;
    }
    if (!authUser) {
        setBasicUserProfile(null);
        return;
    }
    if (authUser.isAnonymous) {
        setBasicUserProfile({
            uid: authUser.uid,
            isAnonymous: true,
            email: null,
        });
    } else {
        if (!isLoadingProfileDoc && userProfileData) {
            setBasicUserProfile({ ...authUser, ...userProfileData });
        }
    }
  }, [authUser, isAuthLoading, userProfileData, isLoadingProfileDoc]);

  const isProfileLoading = isAuthLoading || (!authUser?.isAnonymous && isLoadingProfileDoc);
  
  return { 
    user: authUser, 
    basicUserProfile, 
    isUserLoading: isProfileLoading, // The main loading flag now includes profile doc loading
    isProfileLoading,
    userError
  };
};
