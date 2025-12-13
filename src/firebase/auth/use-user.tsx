
'use client';

import { useFirebase } from '../provider';
import type { UserHookResult } from '../provider';
import type { User } from '@/types';
import { type Plan } from '@/app/(admin)/admin/packages/data';

// This is the FULLY hydrated user profile, including the resolved plan.
// The AuthProvider is responsible for creating this object.
export type UserProfile = User & { plan: Plan | null };

/**
 * A basic hook for accessing the raw Firebase authentication state.
 * It does NOT fetch profile data or plan data. This is the first step in the auth flow.
 * The AuthProvider consumes this to build the full user profile.
 */
export const useUser = (): UserHookResult => {
  // Get the base authentication state from the main Firebase provider.
  const { user: authUser, isUserLoading: isAuthLoading, userError } = useFirebase();
  
  return { 
    user: authUser, 
    isUserLoading: isAuthLoading,
    userError
  };
};
