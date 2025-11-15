
'use client';
import { useEffect } from "react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { StatCard } from "@/components/admin/stat-card";
import { Activity, Users, Package, Globe } from "lucide-react";
import type { Plan } from "./packages/data";
import { seedDefaultPlan } from "./packages/seed";

export default function AdminDashboardPage() {
    const firestore = useFirestore();
    
    // Ensure the default plan exists on page load
    useEffect(() => {
        seedDefaultPlan();
    }, []);

    // The user count can be derived from other means or an aggregate function later.
    // Fetching all users on the dashboard is inefficient and a security risk.
    // We will pass a static '0' for now and remove the isLoading state.
    const usersCount = 0; 
    const usersLoading = false;

    const { data: plans, isLoading: plansLoading } = useCollection<Plan>(useMemoFirebase(() => firestore ? collection(firestore, "plans") : null, [firestore]));
    const { data: domains, isLoading: domainsLoading } = useCollection(useMemoFirebase(() => firestore ? collection(firestore, "allowed_domains") : null, [firestore]));

    const activePlans = plans?.filter(p => p.status === 'active');

    const stats = [
        {
            title: "Total Users",
            value: usersCount, // Using the non-fetching variable
            icon: <Users className="h-4 w-4 text-muted-foreground" />,
            loading: usersLoading,
        },
        {
            title: "Active Plans",
            value: activePlans?.length ?? 0,
            icon: <Package className="h-4 w-4 text-muted-foreground" />,
            loading: plansLoading,
        },
        {
            title: "Allowed Domains",
            value: domains?.length ?? 0,
            icon: <Globe className="h-4 w-4 text-muted-foreground" />,
            loading: domainsLoading,
        },
        {
            title: "API Status",
            value: "Active",
            icon: <Activity className="h-4 w-4 text-muted-foreground" />,
            loading: false,
        },
    ];

  return (
    <>
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
            {stats.map(stat => (
                <StatCard 
                    key={stat.title}
                    title={stat.title}
                    value={stat.value}
                    icon={stat.icon}
                    loading={stat.loading}
                />
            ))}
        </div>
        <div className="mt-8">
            {/* The main data table for the dashboard can go here */}
        </div>
    </>
  );
}
