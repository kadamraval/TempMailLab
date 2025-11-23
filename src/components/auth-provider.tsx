
"use client";

import React, { useEffect } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * AuthProvider is a client-side component that enforces authentication rules.
 * It's the single source of truth for whether a user is logged in and authorized.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, userProfile, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const isAdminRoute = pathname.startsWith('/admin');
  const isLoginPage = pathname === '/login' || pathname === '/login/admin';

  // The main effect that handles redirection logic.
  useEffect(() => {
    // Wait until we have a definitive answer on the user's status.
    if (isUserLoading) {
      return; // Do nothing while loading.
    }

    // Rule 1: If on an admin route, user MUST be a logged-in admin.
    if (isAdminRoute && (!user || user.isAnonymous || !userProfile?.isAdmin)) {
      router.replace('/login/admin');
      return;
    }

    // Rule 2: If on a regular login page but already logged in as a non-anonymous user,
    // redirect to the main dashboard. This prevents logged-in users from seeing the login page again.
    if (isLoginPage && user && !user.isAnonymous) {
      if (userProfile?.isAdmin && pathname === '/login/admin') {
         router.replace('/admin');
      } else if (!isAdminRoute) {
         router.replace('/');
      }
      return;
    }

  }, [isUserLoading, user, userProfile, pathname, router, isAdminRoute, isLoginPage]);


  // While the initial user authentication and profile fetching is in progress,
  // show a global loading screen. This is the only loading check needed.
  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading Application...</p>
        </div>
      </div>
    );
  }

  // If we are on an admin route but the logic above hasn't redirected yet,
  // it might mean we are still waiting for the redirect to complete.
  // Show a loading screen to prevent a flash of unauthenticated content.
  if (isAdminRoute && !userProfile?.isAdmin) {
      return (
           <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">Verifying access...</p>
                </div>
           </div>
      );
  }

  // Once all checks pass, render the requested page.
  return <>{children}</>;
}
