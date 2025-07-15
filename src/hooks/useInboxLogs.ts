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
    if (!isFirebaseClientConfigured) {
      setLoading(false);
      // Optional: Set dummy data if you want to see the UI without a connection
      // setLogs([
      //   { id: 'dummy1', email: 'test1@example.com', userId: 'anon1', createdAt: new Date().toLocaleString(), expiresAt: new Date().toLocaleString(), emailCount: 0, domain: 'example.com' },
      //   { id: 'dummy2', email: 'test2@example.com', userId: 'anon2', createdAt: new Date().toLocaleString(), expiresAt: new Date().toLocaleString(), emailCount: 3, domain: 'example.com' },
      // ]);
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
