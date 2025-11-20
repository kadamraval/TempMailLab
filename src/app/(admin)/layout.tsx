
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
  const isAuthorizedAdmin = user && userProfile?.isAdmin;

  // This effect handles redirection after all loading is complete.
  useEffect(() => {
    // Only run redirection logic when loading is finished.
    if (finishedLoading) {
      // If we are not on the login page and the user is not an authorized admin,
      // redirect them to the admin login page.
      if (!isLoginPage && !isAuthorizedAdmin) {
        router.push('/login/admin');
      }
    }
  }, [finishedLoading, isAuthorizedAdmin, isLoginPage, router]);

  // If we are on the login page, render it directly.
  // The logic inside LoginForm will handle redirection upon successful login.
  if (isLoginPage) {
    return <>{children}</>;
  }
  
  // If loading is not finished OR the user is not yet confirmed as an admin,
  // show a full-page loader. This prevents flicker and premature rendering.
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
