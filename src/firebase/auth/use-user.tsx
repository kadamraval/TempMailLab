
'use client';

import { useFirebase } from '../provider';
import type { User as UserType } from '@/types';
import { useState, useEffect } from 'react';
import { useFirestore } from '../provider';
import { doc, getDoc } from 'firebase/firestore';

// This is now the BASIC user profile, without the plan.
// It combines auth data with the Firestore user document.
export type UserProfile = UserType;

export interface UseUserResult {
  user: UserProfile | null;
  isUserLoading: boolean;
  userError: Error | null;
}

/**
 * A hook that provides a partially hydrated user profile.
 * It combines the raw Firebase Auth state with the corresponding user document from Firestore.
 * It does NOT fetch the plan. AuthProvider consumes this to build the final profile.
 */
export const useUser = (): UseUserResult => {
  // Get the base authentication state from the main Firebase provider.
  const { user: authUser, isUserLoading: isAuthLoading, userError } = useFirebase();
  const firestore = useFirestore();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    // If auth state is still loading, do nothing.
    if (isAuthLoading) {
      setProfileLoading(true);
      return;
    }

    // If there is no authenticated user at all, this is a true guest.
    if (!authUser) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    // If the user is a registered user, fetch their profile from Firestore.
    const fetchUserProfile = async () => {
      setProfileLoading(true);
      if (!firestore) {
        console.error("Firestore not available in useUser");
        setProfileLoading(false);
        return;
      };
      
      try {
        const userDocRef = doc(firestore, 'users', authUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          // Combine auth data with Firestore data
          setProfile({ ...authUser, ...userDocSnap.data() } as UserProfile);
        } else {
          // This case happens during registration before the user doc is created.
          // Fallback to a profile with just the auth data. The AuthProvider/server action will create the doc.
           setProfile({ 
            uid: authUser.uid,
            email: authUser.email,
            isAnonymous: authUser.isAnonymous,
            planId: 'free-default'
          });
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        // In case of error, provide a basic profile to avoid crashing the app
        setProfile({ uid: authUser.uid, email: authUser.email, isAnonymous: authUser.isAnonymous });
      } finally {
        setProfileLoading(false);
      }
    };
    
    if (authUser.isAnonymous) {
        // For anonymous users, we create a simple profile without a database lookup.
        setProfile({
            uid: authUser.uid,
            email: null,
            isAnonymous: true,
        });
        setProfileLoading(false);
    } else {
        fetchUserProfile();
    }

  }, [authUser, isAuthLoading, firestore]);

  return { 
    user: profile,
    isUserLoading: isAuthLoading || isProfileLoading,
    userError,
  };
};

    