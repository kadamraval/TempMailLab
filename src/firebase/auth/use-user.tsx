
'use client';

import { useFirebase } from '../provider';
import type { UserHookResult } from '../provider';
import { useDoc, useMemoFirebase, useFirestore } from '..';
import type { User } from '@/types';
import { doc } from 'firebase/firestore';


// This is the user profile from the `users` collection.
export interface UserProfile extends User {
  // Add any additional profile properties here
}

export interface UserHookResultWithProfile extends UserHookResult {
  userProfile: UserProfile | null;
  isProfileLoading: boolean;
}


/**
 * Hook for accessing the authenticated user's state and their Firestore profile.
 */
export const useUser = (): UserHookResultWithProfile => {
  const { user, isUserLoading, userError } = useFirebase();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  return { user, userProfile, isUserLoading, isProfileLoading: isUserLoading || isProfileLoading, error: userError };
};
