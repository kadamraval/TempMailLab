
"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase-client';
import { Loader2 } from 'lucide-react';
import { onIdTokenChanged, type User } from 'firebase/auth';

const publicRoutes = ['/login', '/register', '/'];
const adminRoute = '/admin';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, (user: User | null) => {
      // Regardless of the outcome, the auth check is complete.
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading Application...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
