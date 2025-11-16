'use client';

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Loader2 } from "lucide-react";
import { UserInboxClient } from "./user-inbox-client"; // Use the new dedicated component
import { collection, query, where } from "firebase/firestore";
import type { Plan } from "@/app/(admin)/admin/packages/data";

export default function UserInboxPage() {
  const firestore = useFirestore();

  // This data fetching remains the same
  const plansQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
        collection(firestore, "plans"),
        where("status", "==", "active")
    );
  }, [firestore]);

  const { data: plans, isLoading: isLoadingPlans } = useCollection<Plan>(plansQuery);
  
  if (isLoadingPlans) {
    return (
      <div className="flex items-center justify-center min-h-[480px]">
          <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  // Render the new UserInboxClient instead of the generic DashboardClient
  return (
    <UserInboxClient plans={plans || []} />
  );
}
