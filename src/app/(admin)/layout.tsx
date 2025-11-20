
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
  const { user, userProfile, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === '/login/admin';
  
  useEffect(() => {
    // This effect handles redirection logic once all loading is complete.
    // It only runs if we are not currently loading user data.
    if (!isUserLoading) {
      // If we are NOT on the login page and the user is NOT an authorized admin,
      // redirect them to the admin login page.
      if (!isLoginPage && (!user || user.isAnonymous || !userProfile?.isAdmin)) {
        router.replace('/login/admin');
      }
    }
  }, [isUserLoading, user, userProfile, isLoginPage, router, pathname]);

  // If the current page is the login page itself, render it directly.
  // The login form will handle redirecting the user away upon successful login.
  if (isLoginPage) {
    return <>{children}</>;
  }
  
  // While we are waiting for a definitive answer on the user's auth/admin status,
  // show a loading screen. This is the key change to prevent the redirect loop.
  // It waits for a definitive "yes" or "no" on admin status before rendering the page or redirecting.
  if (isUserLoading || !userProfile?.isAdmin) {
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
