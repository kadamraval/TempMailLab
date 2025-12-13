
"use client";

import React, { useEffect } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useFirebase } from '@/firebase';

/**
 * AuthProvider is a client-side component that enforces authentication rules.
 * It's the single source of truth for whether a user is logged in and authorized.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // isAuthLoading is the true source of truth for the initial Firebase auth check.
  const { user: authUser, isUserLoading: isAuthLoading } = useFirebase(); 
  
  // useUserWithProfile is now only for fetching profile data for LOGGED-IN users.
  const { userProfile, isUserLoading: isProfileLoading } = useUser();
  
  const router = useRouter();
  const pathname = usePathname();

  const isAdminRoute = pathname.startsWith('/admin');
  const isLoginPage = pathname === '/login';
  const isAdminLoginPage = pathname === '/login/admin';

  // Determine the overall loading state.
  // We are loading if the initial auth check is running,
  // OR if we have a logged-in user but are still fetching their profile.
  const isLoading = isAuthLoading || (!!authUser && isProfileLoading);

  useEffect(() => {
    // Wait until we have a definitive answer on the user's status.
    if (isLoading) {
      return; // Do nothing while loading.
    }

    // Rule 1: If on an admin route, user MUST be a logged-in admin.
    // userProfile is guaranteed to be loaded here if authUser exists.
    if (isAdminRoute && !userProfile?.isAdmin) {
      router.replace('/login/admin');
      return;
    }

    // Rule 2: If on a login page but already logged in, redirect.
    if ((isLoginPage || isAdminLoginPage) && authUser) {
      if (userProfile?.isAdmin && isAdminLoginPage) {
         router.replace('/admin');
      } else if (!isAdminRoute) {
         router.replace('/');
      }
      return;
    }

  }, [isLoading, authUser, userProfile, pathname, router, isAdminRoute, isLoginPage, isAdminLoginPage]);


  // While the initial user authentication and profile fetching is in progress,
  // show a global loading screen. This is the only loading check needed.
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Initializing your secure inbox...</p>
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
