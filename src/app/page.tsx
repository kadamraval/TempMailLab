
"use client";

import { DashboardClient } from "@/components/dashboard-client";
import { useUser } from "@/firebase";
import { Loader2 } from "lucide-react";
import { Hero } from "@/components/hero";

export default function HomePage() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (user) {
    return (
      <main className="container mx-auto px-4 py-8">
        <DashboardClient />
      </main>
    );
  }

  return <Hero />;
}
