
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, onSnapshot, DocumentData, DocumentSnapshot, FirestoreError } from 'firebase/firestore';
import { Auth, User as AuthUser, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import type { User as UserProfile } from '@/types';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

// Internal state for user authentication & profile
interface UserState {
  user: AuthUser | null;
  userProfile: UserProfile | null;
  isUserLoading: boolean;
  isProfileLoading: boolean;
  error: Error | null;
}

// Combined state for the Firebase context
export interface FirebaseContextState extends UserState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
}

// Return type for useFirebase()
export interface FirebaseServicesAndUser extends FirebaseContextState {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

// Return type for useUser() - specific to user auth and profile state
export interface UserHookResult extends UserState {}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

/**
 * FirebaseProvider manages and provides Firebase services, user authentication, and user profile state.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [userState, setUserState] = useState<UserState>({
    user: null,
    userProfile: null,
    isUserLoading: true,
    isProfileLoading: true,
    error: null,
  });

  // Effect to subscribe to Firebase auth state changes
  useEffect(() => {
    if (!auth) {
      setUserState(s => ({ ...s, isUserLoading: false, isProfileLoading: false, error: new Error("Auth service not provided.") }));
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUserState(prevState => ({ ...prevState, user: firebaseUser, isUserLoading: false }));
      },
      (error) => {
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserState(s => ({ ...s, user: null, isUserLoading: false, isProfileLoading: false, error }));
      }
    );
    return () => unsubscribeAuth();
  }, [auth]);

  // Effect to subscribe to the user's Firestore profile document
  useEffect(() => {
    if (!userState.user || !firestore) {
        // If there's no auth user, there's no profile to load.
        setUserState(prevState => ({ ...prevState, userProfile: null, isProfileLoading: false }));
        return;
    }

    // Set loading state for the profile
    setUserState(prevState => ({ ...prevState, isProfileLoading: true }));

    const userDocRef = doc(firestore, 'users', userState.user.uid);
    const unsubscribeProfile = onSnapshot(userDocRef, 
        (snapshot: DocumentSnapshot<DocumentData>) => {
            if (snapshot.exists()) {
                setUserState(prevState => ({ ...prevState, userProfile: snapshot.data() as UserProfile, isProfileLoading: false, error: null }));
            } else {
                // User is authenticated, but no profile doc exists.
                setUserState(prevState => ({ ...prevState, userProfile: null, isProfileLoading: false, error: null }));
            }
        },
        (err: FirestoreError) => {
             console.error("FirebaseProvider: onSnapshot error for user profile:", err);
             setUserState(prevState => ({ ...prevState, userProfile: null, isProfileLoading: false, error: err }));
        }
    );

    return () => unsubscribeProfile();
  }, [userState.user, firestore]);

  // Memoize the context value
  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      ...userState,
    };
  }, [firebaseApp, firestore, auth, userState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

function useFirebaseInternal(): FirebaseContextState {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
  return context;
}

export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useFirebaseInternal();
  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }
  return context as FirebaseServicesAndUser;
};

export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  if (typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  return memoized;
}

/**
 * Hook for accessing the authenticated user's state and their Firestore profile.
 */
export const useUser = (): UserHookResult => {
  const { user, userProfile, isUserLoading, isProfileLoading, error } = useFirebaseInternal();
  return { user, userProfile, isUserLoading, isProfileLoading, error };
};
