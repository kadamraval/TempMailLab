
'use client';

import { useFirebase } from '../provider';
import type { UserHookResult } from '../provider';
import { useDoc, useMemoFirebase, useFirestore } from '..';
import type { User } from '@/types';
import { doc } from 'firebase/firestore';


// This is the user profile from the `users` collection.
// It directly uses the `User` type from our central types file.
export type UserProfile = User;

export interface UserHookResultWithProfile extends UserHookResult {
  userProfile: UserProfile | null;
}


/**
 * Hook for accessing the authenticated user's state and their Firestore profile.
 */
export const useUser = (): UserHookResultWithProfile => {
  const { user, isUserLoading: isAuthLoading, userError } = useFirebase();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const combinedLoading = isAuthLoading || (user && !user.isAnonymous && !userProfile && isProfileLoading);

  return { 
    user, 
    userProfile, 
    isUserLoading: combinedLoading,
    userError: userError 
  };
};
