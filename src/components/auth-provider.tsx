
"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase-client';
import { Loader2 } from 'lucide-react';
import { onIdTokenChanged } from 'firebase/auth';

const publicRoutes = ['/login', '/register', '/'];
const privateRoutes = ['/dashboard', '/admin'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      const isPublicRoute = publicRoutes.some(p => pathname.startsWith(p));
      
      if (!user && !isPublicRoute) {
        // If the user is not logged in and trying to access a private page,
        // redirect to login.
        router.replace('/login');
      } else if (user) {
        // If the user is logged in, check for role-based redirects.
        const idTokenResult = await user.getIdTokenResult();
        const isAdmin = !!idTokenResult.claims.admin;
        const isAdminRoute = pathname.startsWith('/admin');

        if (isAdmin && !isAdminRoute) {
            router.replace('/admin');
        } else if (!isAdmin && isAdminRoute) {
            router.replace('/dashboard');
        } else if (pathname === '/login' || pathname === '/register') {
            router.replace('/dashboard');
        }
      }
      
      // Authentication check is complete, stop loading.
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [pathname, router]);

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
