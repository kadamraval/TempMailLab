// @/hooks/useInboxLogs.ts
"use client"

import { useState, useEffect } from 'react';
import { firestore } from '@/lib/firebase-admin';
import type { InboxLog } from '@/types';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';

// A helper function to check if Firebase is configured on the client
// by checking the existence of the client-side config object.
// Note: This is a simplified check. A more robust check would involve
// checking specific properties of the config object.
const isFirebaseClientConfigured = () => {
  return typeof window !== 'undefined' && (window as any).firebase?.apps?.length > 0;
};


export function useInboxLogs() {
  const [logs, setLogs] = useState<InboxLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // This hook relies on the server-side check for Firebase config.
  // We can't easily check process.env on the client.
  const isFirebaseConfigured = !!firestore;

  useEffect(() => {
    if (!firestore) {
      setLoading(false);
      return;
    }

    const q = query(collection(firestore, 'inboxes'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const inboxLogs: InboxLog[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          const formatTimestamp = (ts: Timestamp | undefined) => {
            if (!ts) return 'N/A';
            return new Date(ts.seconds * 1000).toLocaleString();
          }

          inboxLogs.push({
            id: doc.id,
            email: data.email || 'N/A',
            userId: data.userId || 'N/A',
            createdAt: formatTimestamp(data.createdAt),
            expiresAt: formatTimestamp(data.expiresAt),
            emailCount: data.emailCount || 0,
            domain: data.domain || 'N/A',
          });
        });
        setLogs(inboxLogs);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching inbox logs:", err);
        setError("Failed to fetch inbox logs. See console for details.");
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return { logs, loading, error, isFirebaseConfigured };
}
