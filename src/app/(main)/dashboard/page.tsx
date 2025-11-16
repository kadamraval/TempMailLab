
"use client";

import { DashboardClient } from "@/components/dashboard-client";
import { useUser, useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { type Plan } from "@/app/(admin)/admin/packages/data";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { isUserLoading: isUserAuthLoading } = useUser();
  const firestore = useFirestore();

  // Fetch all active plans to pass to the client
  const plansQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "plans"), where("status", "==", "active"));
  }, [firestore]);

  const { data: plans, isLoading: arePlansLoading } = useCollection<Plan>(plansQuery);

  if (isUserAuthLoading || arePlansLoading) {
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
       <DashboardClient plans={plans || []} />
    </main>
  );
}
