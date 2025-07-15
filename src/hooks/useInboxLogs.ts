// @/hooks/useInboxLogs.ts
"use client"

import { useState, useEffect } from 'react';
import { firestore as clientFirestore, isFirebaseClientConfigured } from '@/lib/firebase-client';
import type { InboxLog } from '@/types';
import { collection, onSnapshot, query, orderBy, type Timestamp } from 'firebase/firestore';


export function useInboxLogs() {
  const [logs, setLogs] = useState<InboxLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isFirebaseConfigured = isFirebaseClientConfigured();

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const q = query(collection(clientFirestore, 'inboxes'), orderBy('createdAt', 'desc'));

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
  }, [isFirebaseConfigured]);

  return { logs, loading, error, isFirebaseConfigured };
}
