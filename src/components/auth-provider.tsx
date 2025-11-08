"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase-client';
import { Loader2 } from 'lucide-react';
import { onIdTokenChanged } from 'firebase/auth';

const publicRoutes = ['/login', '/register', '/'];
const adminRoutes = ['/admin'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
      const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

      if (user) {
        const idTokenResult = await user.getIdTokenResult();
        const isAdmin = !!idTokenResult.claims.admin;

        if (isAdmin && !isAdminRoute) {
          router.replace('/admin');
        } else if (!isAdmin && isAdminRoute) {
          router.replace('/dashboard');
        } else if (pathname === '/login' || pathname === '/register') {
           router.replace('/dashboard');
        }
        
      } else {
        if (!isPublicRoute) {
          router.replace('/login');
        }
      }
      
      // Delay hiding the loader to prevent flashes of content
      setTimeout(() => setLoading(false), 300);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading Application...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
