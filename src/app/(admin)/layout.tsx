
"use client"

import React, { useState } from 'react';
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminHeader } from '@/components/admin-header';
import { useUser } from '@/firebase/auth/use-user';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { userProfile, isUserLoading } = useUser();
  const pathname = usePathname();

  // The AuthProvider now handles the primary loading and redirection logic.
  // This layout only needs to handle its own UI states.

  const isLoginPage = pathname === '/login/admin';

  // If we're on the login page, render it directly without the admin shell.
  // The AuthProvider will handle redirecting away if the user is already logged in.
  if (isLoginPage) {
    return <>{children}</>;
  }
  
  // While the AuthProvider is still loading, or if the user is not an admin,
  // show a loading screen. This prevents any flash of the admin UI for unauthorized users.
  // This is a simplified check because the heavy lifting is done in AuthProvider.
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
