
"use client";

import { DashboardClient } from "@/components/dashboard-client";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { type Plan } from "@/app/(admin)/admin/packages/data";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { user, isUserLoading: isUserAuthLoading } = useUser();
  const firestore = useFirestore();

  // Try to get the default plan for guest users.
  // Logged-in users' plans will be determined within DashboardClient based on their user record.
  const defaultPlanRef = useMemoFirebase(() => {
    if (!firestore) return null;
    // We only fetch the default plan here. If a user is logged in, DashboardClient will handle it.
    return doc(firestore, 'plans', 'default');
  }, [firestore]);

  const { data: defaultPlan, isLoading: isPlanLoading } = useDoc<Plan>(defaultPlanRef);

  // Show a loader while we're checking auth status or fetching the essential default plan
  if (isUserAuthLoading || isPlanLoading) {
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
       <DashboardClient initialPlan={defaultPlan} />
    </main>
  );
}
