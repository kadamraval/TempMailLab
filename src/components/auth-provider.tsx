
"use client";

import React, { useEffect } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useFirebase } from '@/firebase';

/**
 * AuthProvider is a client-side component that enforces authentication rules.
 * It is the single source of truth for loading states and redirection logic.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // useFirebase provides the raw, immediate authentication state from Firebase.
  const { user: authUser, isUserLoading: isAuthLoading } = useFirebase();
  
  // useUser is now specifically for fetching extended profile data for REGISTERED users.
  // We use it here to check for admin status after a user is confirmed to be logged in.
  const { userProfile, isUserLoading: isProfileLoading } = useUser();
  
  const router = useRouter();
  const pathname = usePathname();

  const isAdminRoute = pathname.startsWith('/admin');
  const isLoginPage = pathname === '/login';
  const isAdminLoginPage = pathname === '/login/admin';

  // The definitive loading state. The app is loading if:
  // 1. The initial Firebase auth check is still running (isAuthLoading).
  // 2. OR, if we know we have a logged-in user (authUser exists), but we are still fetching their profile data (isProfileLoading).
  // For guests (authUser is null), this simplifies to just waiting for isAuthLoading.
  const isLoading = isAuthLoading || (!!authUser && isProfileLoading);

  useEffect(() => {
    // We must wait until the loading state is fully resolved before running any logic.
    if (isLoading) {
      return;
    }

    // --- Redirection Logic ---

    // Rule 1: Protect admin routes.
    // If we're on an admin route, the user must be logged in and their profile must show isAdmin: true.
    if (isAdminRoute && !userProfile?.isAdmin) {
      router.replace('/login/admin');
      return;
    }

    // Rule 2: Handle already-logged-in users trying to access login pages.
    if (authUser && (isLoginPage || isAdminLoginPage)) {
       // If an admin is on the admin login page, send them to the dashboard.
      if (userProfile?.isAdmin && isAdminLoginPage) {
         router.replace('/admin');
      } 
      // If any other logged-in user is on a standard login page, send them to the homepage.
      else if (!isAdminRoute) {
         router.replace('/');
      }
      return;
    }

  }, [isLoading, authUser, userProfile, pathname, router, isAdminRoute, isLoginPage, isAdminLoginPage]);


  // --- Render Logic ---

  // While waiting for the definitive user state, show a global loading screen.
  // This is now the ONLY loading screen that matters for initialization.
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

  // If we are on an admin route but the logic above hasn't redirected (and is no longer loading),
  // it means the user is not an admin. We show a loading screen while the redirect effect takes place
  // to prevent a brief flash of the unauthorized UI.
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

  // Once all checks pass and we are not loading, render the requested page.
  return <>{children}</>;
}
