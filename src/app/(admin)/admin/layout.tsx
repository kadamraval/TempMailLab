
"use client"

import React, { useState } from 'react';
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminHeader } from '@/components/admin-header';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
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
