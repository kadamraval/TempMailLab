
"use client"

import React, { useState, useEffect } from 'react';
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminHeader } from '@/components/admin-header';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, userProfile, isUserLoading, isProfileLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // If loading is finished and there's no user or the user is not an admin, redirect.
    if (!isUserLoading && !isProfileLoading && (!user || !userProfile?.isAdmin)) {
        router.push('/dashboard'); 
    }
  }, [user, userProfile, isUserLoading, isProfileLoading, router]);


  // Show a loading screen while we verify admin status.
  // This prevents any child components from attempting to render and fetch data.
  if (isUserLoading || isProfileLoading || !userProfile || !userProfile.isAdmin) {
      return (
           <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">Verifying access...</p>
                </div>
           </div>
      );
  }
  
  // Only if the user is a verified admin, render the admin layout and its children.
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <AdminSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex flex-col transition-all duration-300 ${isCollapsed ? 'sm:pl-16' : 'sm:pl-64'}`}>
        <AdminHeader />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            {children}
        </main>
      </div>
    </div>
  )
}
