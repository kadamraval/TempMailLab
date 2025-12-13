
"use client";

import React, { useEffect } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { useAuth } from '@/firebase';

/**
 * AuthProvider is a client-side component that enforces authentication rules.
 * It is the single source of truth for loading states and redirection logic.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // useUser now correctly handles both guests and registered users,
  // and its `isUserLoading` flag is the definitive source of truth for the entire app's loading state.
  const { user, userProfile, isUserLoading } = useUser();
  const auth = useAuth();
  
  const router = useRouter();
  const pathname = usePathname();

  const isAdminRoute = pathname.startsWith('/admin');
  const isLoginPage = pathname === '/login';
  const isAdminLoginPage = pathname === '/login/admin';

  useEffect(() => {
    // If auth is ready and there's no user at all (not even anonymous), sign them in anonymously.
    if (auth && !user && !isUserLoading) {
      initiateAnonymousSignIn(auth);
    }

    // Wait until the user's status (guest or registered) and profile are fully resolved.
    if (isUserLoading) {
      return;
    }

    // --- Redirection Logic ---

    // Rule 1: Protect admin routes.
    // An admin must be logged in (not a guest) and have the `isAdmin` flag.
    if (isAdminRoute && !userProfile?.isAdmin) {
      router.replace('/login/admin');
      return;
    }

    // Rule 2: Handle already-logged-in users trying to access login pages.
    if (user && !user.isAnonymous && (isLoginPage || isAdminLoginPage)) {
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

  }, [isUserLoading, user, userProfile, pathname, router, isAdminRoute, isLoginPage, isAdminLoginPage, auth]);


  // --- Render Logic ---

  // While waiting for the definitive user state (guest or registered), show a global loading screen.
  if (isUserLoading || !userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Initializing your secure inbox...</p>
        </div>
      </div>
    );
  }

  // Once all checks pass and we are not loading, render the requested page.
  return <>{children}</>;
}
