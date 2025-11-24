'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  collection,
  query,
  where
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

// This is a robust way to get the path, handling both CollectionReference and Query.
function getPathFromRefOrQuery(refOrQuery: any): string {
    if (refOrQuery.type === 'collection') {
        return refOrQuery.path;
    }
    // For queries, we access the private _query property to get to the path.
    // This is a common workaround for this SDK limitation.
    if (refOrQuery._query) {
        return refOrQuery._query.path.segments.join('/');
    }
    // Fallback for other potential structures
    return refOrQuery.path || '';
}


export function useCollection<T = any>(
    memoizedTargetRefOrQuery: (ReturnType<typeof collection> | ReturnType<typeof query>) & {__memo?: boolean}  | null | undefined,
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
      memoizedTargetRefOrQuery as Query<DocumentData>,
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
