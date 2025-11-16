
"use client";

import { UserDashboardSidebar } from "@/components/user-dashboard-sidebar";

export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 md:grid-cols-[180px_1fr]">
        <aside>
          <UserDashboardSidebar />
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
