
"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase-client';
import { Loader2 } from 'lucide-react';
import { onIdTokenChanged, type User } from 'firebase/auth';

const publicRoutes = ['/login', '/register'];
// The homepage is a special case, it's public but we might redirect if logged in.
const homeRoute = '/';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user: User | null) => {
      const isPublicRoute = publicRoutes.some(p => pathname.startsWith(p));
      const isHomePage = pathname === homeRoute;
      const isPrivateRoute = !isPublicRoute && !isHomePage;

      if (user) {
        // User is logged in
        const idTokenResult = await user.getIdTokenResult();
        const isAdmin = !!idTokenResult.claims.admin;
        const isAdminRoute = pathname.startsWith('/admin');

        if (isPublicRoute || isHomePage) {
            // If on a public page or home, redirect to their dashboard
            router.replace(isAdmin ? '/admin' : '/dashboard');
        } else if (isAdmin && !isAdminRoute) {
            // Admin on non-admin page
            router.replace('/admin');
        } else if (!isAdmin && isAdminRoute) {
            // Non-admin on admin page
            router.replace('/dashboard');
        }
        // Otherwise, they are on the correct private page, do nothing.
        
      } else {
        // User is not logged in
        if (isPrivateRoute) {
          // If trying to access a private route, redirect to login
          router.replace('/login');
        }
        // Otherwise, they are on a public page or home, do nothing.
      }
      
      // Regardless of the outcome, the auth check is complete.
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
