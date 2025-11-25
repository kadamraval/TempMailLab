
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
        return query(
            collection(firestore, "plans"),
            where("status", "==", "active")
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
        <div className="py-16 sm:py-20">
            <div className="container mx-auto px-4">
                <PricingSection plans={plans || []} />
                <div className="border-t mt-16 pt-16">
                    <PricingComparisonTable plans={plans || []} />
                </div>
            </div>
        </div>
    );
}
