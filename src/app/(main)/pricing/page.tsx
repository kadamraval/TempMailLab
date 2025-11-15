
"use client";

import { PricingSection } from "@/components/pricing-section";
import { PricingComparisonTable } from "@/components/pricing-comparison-table";
import { collection, query, where } from "firebase/firestore";
import type { Plan } from "@/app/(admin)/admin/packages/data";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Loader2 } from "lucide-react";

export default function PricingPage() {
    const firestore = useFirestore();

    const plansQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        // Fetch all active plans except the system's 'Default' plan.
        return query(
            collection(firestore, "plans"),
            where("status", "==", "active"),
            where("name", "!=", "Default") 
        );
    }, [firestore]);

    const { data: plans, isLoading } = useCollection<Plan>(plansQuery);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <>
            <PricingSection plans={plans || []} />
            <div className="border-t">
                <PricingComparisonTable plans={plans || []} />
            </div>
        </>
    );
}

    