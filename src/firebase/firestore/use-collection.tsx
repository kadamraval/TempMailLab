'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

function getPathFromRefOrQuery(refOrQuery: CollectionReference | Query): string {
    if (refOrQuery.type === 'collection') {
        return refOrQuery.path;
    } else {
        // Accessing the path from a query has changed in recent SDK versions.
        // We now need to access it through the CollectionReference it's based on.
        return refOrQuery.converter ? (refOrQuery as Query<DocumentData>).path : (refOrQuery as CollectionReference<DocumentData>).path;
    }
}


export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean})  | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading true
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false); // If no query, not loading.
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: ResultItemType[] = snapshot.docs.map(doc => ({
          ...(doc.data() as T),
          id: doc.id
        }));
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (error: FirestoreError) => {
        // Firestore security rule errors have a specific code.
        if (error.code === 'permission-denied') {
            const contextualError = new FirestorePermissionError({
              operation: 'list',
              path: getPathFromRefOrQuery(memoizedTargetRefOrQuery),
            });
            setError(contextualError);
             // It's a permission error, but the hook shouldn't crash the app.
             // It should return an empty data array and the error.
            setData([]); 
            errorEmitter.emit('permission-error', contextualError);
        } else {
             // For other types of errors (e.g., network), set them directly.
            setError(error);
        }
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery]);
  
  if(memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    throw new Error('A firestore query was not properly memoized using useMemoFirebase. This will cause infinite loops.');
  }

  return { data, isLoading, error };
}
