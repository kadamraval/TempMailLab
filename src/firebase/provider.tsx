'use client';

import React, {
  DependencyList,
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useState,
  useEffect,
} from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, getDoc } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import type { User as AppUser } from '@/types';

// Internal state for user authentication and profile
interface UserState {
  user: User | null;
  userProfile: AppUser | null; // This is the firestore user profile
  isUserLoading: boolean; // For auth state
  isProfileLoading: boolean; // For profile fetching
  error: Error | null;
}

// Combined state for the Firebase context
export interface FirebaseContextState extends UserState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
}

// Return type for useUser() - specific to user auth state and profile
export interface UserHookResult {
  user: User | null;
  userProfile: AppUser | null;
  isUserLoading: boolean;
  isProfileLoading: boolean;
  error: Error | null;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(
  undefined
);

/**
 * FirebaseProvider manages and provides Firebase services and user authentication state.
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
    isUserLoading: true, // Start loading until first auth event
    isProfileLoading: true,
    error: null,
  });

  // Effect to subscribe to Firebase auth state changes
  useEffect(() => {
    if (!auth) {
      setUserState({
        user: null,
        userProfile: null,
        isUserLoading: false,
        isProfileLoading: false,
        error: new Error('Auth service not provided.'),
      });
      return;
    }

    setUserState((s) => ({ ...s, isUserLoading: true }));

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUserState((s) => ({ ...s, user: firebaseUser, isUserLoading: false }));
      },
      (error) => {
        console.error('FirebaseProvider: onAuthStateChanged error:', error);
        setUserState((s) => ({ ...s, user: null, isUserLoading: false, error }));
      }
    );
    return () => unsubscribe();
  }, [auth]);

  // Effect to fetch user profile from Firestore
  useEffect(() => {
    if (!firestore || !userState.user) {
      setUserState((s) => ({ ...s, userProfile: null, isProfileLoading: false }));
      return;
    }

    setUserState((s) => ({ ...s, isProfileLoading: true }));
    const userDocRef = doc(firestore, 'users', userState.user.uid);

    getDoc(userDocRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          setUserState((s) => ({
            ...s,
            userProfile: docSnap.data() as AppUser,
            isProfileLoading: false,
          }));
        } else {
          // No profile doc yet, this is fine.
          setUserState((s) => ({ ...s, userProfile: null, isProfileLoading: false }));
        }
      })
      .catch((error) => {
        console.error('FirebaseProvider: getDoc for user profile error:', error);
        setUserState((s) => ({ ...s, userProfile: null, isProfileLoading: false, error }));
      });
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

/**
 * Hook to access core Firebase services and user authentication state.
 * Throws error if core services are not available or used outside provider.
 * This is the internal hook.
 */
export const useFirebaseInternal = (): FirebaseContextState => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebaseInternal must be used within a FirebaseProvider.');
  }
  return context;
};

/** Hook to access core Firebase services. */
export const useFirebase = () => {
    const context = useFirebaseInternal();
    if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth) {
        throw new Error('Firebase core services not available. Check FirebaseProvider props.');
    }
    return {
        firebaseApp: context.firebaseApp,
        firestore: context.firestore,
        auth: context.auth,
    };
}


/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

type MemoFirebase<T> = T & { __memo?: boolean };

export function useMemoFirebase<T>(
  factory: (db: Firestore | null) => T,
  deps: DependencyList
): T | MemoFirebase<T> {
  const { firestore } = useContext(FirebaseContext) ?? {};
  const memoized = useMemo(() => factory(firestore ?? null), [firestore, ...deps]);

  if (typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;

  return memoized;
}