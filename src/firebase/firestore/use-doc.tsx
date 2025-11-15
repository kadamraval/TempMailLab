
'use client';
    
import { useState, useEffect } from 'react';
import {
  DocumentReference,
  onSnapshot,
  DocumentData,
  FirestoreError,
  DocumentSnapshot,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useDoc hook.
 * @template T Type of the document data.
 */
export interface UseDocResult<T> {
  data: WithId<T> | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/**
 * React hook to subscribe to a single Firestore document in real-time.
 * Handles nullable references gracefully.
 * 
 * IMPORTANT! YOU MUST MEMOIZE the inputted docRef or BAD THINGS WILL HAPPEN.
 * Use useMemoFirebase to memoize it per React guidance. Also make sure that its dependencies are stable.
 *
 * @template T Optional type for document data. Defaults to any.
 * @param {DocumentReference<DocumentData> | null | undefined} memoizedDocRef -
 * The Firestore DocumentReference. Waits if null/undefined.
 * @returns {UseDocResult<T>} Object with data, isLoading, error.
 */
export function useDoc<T = any>(
  memoizedDocRef: (DocumentReference<DocumentData> & {__memo?: boolean}) | null | undefined,
): UseDocResult<T> {
  type StateDataType = WithId<T> | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    // If the docRef is not ready yet, set loading and wait.
    if (!memoizedDocRef) {
        setIsLoading(true);
        setData(null);
        setError(null);
        return;
    }

    // The docRef is ready, start the fetch.
    setIsLoading(true);

    const unsubscribe = onSnapshot(
      memoizedDocRef,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (snapshot.exists()) {
          setData({ ...(snapshot.data() as T), id: snapshot.id });
        } else {
          setData(null); // Document does not exist
        }
        setError(null);
        setIsLoading(false);
      },
      (err: FirestoreError) => {
        // This is a real error from the Firestore backend.
        const contextualError = new FirestorePermissionError({
          operation: 'get',
          path: memoizedDocRef.path,
        });

        setError(contextualError);
        setData(null);
        setIsLoading(false);
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    // Cleanup subscription on unmount or when the docRef changes.
    return () => unsubscribe();
  }, [memoizedDocRef]);

  if(memoizedDocRef && !memoizedDocRef.__memo) {
    console.warn('The document reference passed to useDoc was not memoized with useMemoFirebase. This can cause infinite render loops.', memoizedDocRef);
  }

  return { data, isLoading, error };
}
