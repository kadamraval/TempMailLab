
'use client';
import { StatCard } from "@/components/admin/stat-card";
import { Activity, Users, Package, Globe } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import type { Plan } from "./packages/data";
import { useMemo } from "react";

// This component is now identical to the dashboard page to ensure consistency.
// The primary purpose is to be the default view for `/admin`, which might be the same as `/admin/dashboard`.
export default function AdminPage() {
    const firestore = useFirestore();
    
    // The query for 'users' has been removed as it violates security rules.
    // The total users stat will now show 0 until a secure counting method is implemented.
    const plansQuery = useMemoFirebase(() => firestore ? collection(firestore, "plans") : null, [firestore]);
    const domainsQuery = useMemoFirebase(() => firestore ? collection(firestore, "allowed_domains") : null, [firestore]);

    // The 'users' and 'usersLoading' hooks have been removed.
    const { data: plans, isLoading: plansLoading } = useCollection<Plan>(plansQuery);
    const { data: domains, isLoading: domainsLoading } = useCollection(domainsQuery);

    const activePlans = useMemo(() => plans?.filter(p => p.status === 'active'), [plans]);

    const stats = [
        {
            title: "Total Users",
            value: 0, // Temporarily hardcoded to 0 to prevent error.
            icon: <Users className="h-4 w-4 text-muted-foreground" />,
            loading: false, // No longer loading user data.
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
