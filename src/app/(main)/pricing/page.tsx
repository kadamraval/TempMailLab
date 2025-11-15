
"use client";

import { PricingSection } from "@/components/pricing-section";
import { PricingComparisonTable } from "@/components/pricing-comparison-table";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import type { Plan } from "@/app/(admin)/admin/packages/data";


export default function PricingPage() {
  const firestore = useFirestore();

  // This query is now simpler and correct for public fetching.
  const plansQuery = useMemoFirebase(() => {
      if (!firestore) return null;
      return query(
          collection(firestore, "plans"), 
          where("status", "==", "active")
      );
  }, [firestore]);
  
  const { data: plans, isLoading } = useCollection<Plan>(plansQuery);

  // Exclude the 'Default' plan from the user-facing pricing page
  const displayPlans = plans?.filter(plan => plan.name !== 'Default') || [];

  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-96">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  return (
    <>
      <PricingSection plans={displayPlans} />
      <div className="border-t">
        <PricingComparisonTable plans={displayPlans} />
      </div>
    </>
  );
}

    