
"use client"

import React, { useState, useEffect } from 'react';
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminHeader } from '@/components/admin-header';
import { useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, userProfile, isUserLoading, isProfileLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === '/login/admin';
  const finishedLoading = !isUserLoading && !isProfileLoading;
  const isAuthorizedAdmin = user && !user.isAnonymous && userProfile?.isAdmin === true;

  // This effect handles redirection logic once all loading is complete.
  useEffect(() => {
    // Only perform redirects if we are not currently on the login page itself.
    if (!isLoginPage && finishedLoading) {
      // If loading is finished and the user is not an authorized admin,
      // redirect them to the admin login page.
      if (!isAuthorizedAdmin) {
        router.replace('/login/admin');
      }
    }
  }, [finishedLoading, isAuthorizedAdmin, isLoginPage, router]);


  // If the current page is the login page, render it directly.
  // The login form itself will handle redirecting the user upon successful login.
  if (isLoginPage) {
    return <>{children}</>;
  }
  
  // If we are still waiting for auth or profile data to load,
  // or if the user is not yet confirmed as an admin, show a loading screen.
  // This prevents content from flashing before the redirect can happen.
  if (!finishedLoading || !isAuthorizedAdmin) {
      return (
           <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">Verifying access...</p>
                </div>
           </div>
      );
  }
  
  // If all checks pass, render the full admin layout.
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <AdminSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex flex-col sm:gap-4 sm:py-4 transition-all duration-300 ${isCollapsed ? 'sm:pl-16' : 'sm:pl-64'}`}>
        <AdminHeader />
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            {children}
        </main>
      </div>
    </div>
  )
}
