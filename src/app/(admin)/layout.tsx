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

  // If we are on the login page, render it without the admin layout wrapper.
  // This prevents the redirect loop.
  if (pathname === '/login/admin') {
    return <>{children}</>;
  }

  useEffect(() => {
    // This effect redirects non-admins away from protected admin pages.
    // It runs after all hooks are resolved and checks if the user state is final.
    if (!isUserLoading && !isProfileLoading) {
      if (!user || !userProfile?.isAdmin) {
        router.push('/login/admin'); 
      }
    }
  }, [user, userProfile, isUserLoading, isProfileLoading, router, pathname]);
  
  // While we are verifying the user's admin status, show a full-page loader.
  // This prevents rendering the admin UI to unauthorized users and avoids flicker.
  if (isUserLoading || isProfileLoading || !userProfile?.isAdmin) {
      return (
           <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">Verifying access...</p>
                </div>
           </div>
      );
  }
  
  // If the user is a verified admin, render the full admin layout.
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
