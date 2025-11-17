
'use client';
import { useFirebaseInternal } from '../provider';
import type { UserHookResult } from '../provider';

/**
 * Hook for accessing the authenticated user's state and their Firestore profile.
 */
export const useUser = (): UserHookResult => {
  const { user, userProfile, isUserLoading, isProfileLoading, error } = useFirebaseInternal();
  return { user, userProfile, isUserLoading, isProfileLoading, error };
};
