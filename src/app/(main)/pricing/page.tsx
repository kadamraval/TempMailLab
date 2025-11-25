
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
        <>
            <div className="py-16 sm:py-20 text-center">
                 <div className="container mx-auto px-4">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
                        Pricing
                    </h1>
                    <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">Choose the plan that's right for you, with options for everyone from casual users to professional developers.</p>
                </div>
            </div>
            <PricingSection plans={plans || []} />
            <div className="border-t">
                 <div className="container mx-auto px-4">
                    <PricingComparisonTable plans={plans || []} />
                 </div>
            </div>
        </>
    );
}
