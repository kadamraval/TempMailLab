
"use client";

import { DashboardClient } from "@/components/dashboard-client";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { type Plan } from "@/app/(admin)/admin/packages/data";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { isUserLoading: isUserAuthLoading } = useUser();
  const firestore = useFirestore();

  // This page simply shows the dashboard client. 
  // All logic for fetching plans, including the default plan for guests, is now handled inside DashboardClient.
  // This simplifies the page and ensures the loader only shows for the auth check.
  
  if (isUserAuthLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[480px] rounded-lg border bg-card">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
       <DashboardClient />
    </main>
  );
}

    