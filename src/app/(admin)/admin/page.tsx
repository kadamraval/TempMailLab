
'use client';
import { useCollection } from "@/firebase";
import { collection } from "firebase/firestore";
import { StatCard } from "@/components/admin/stat-card";
import { Activity, Users, Package, Globe } from "lucide-react";
import type { Plan } from "./packages/data";
import { useMemo } from "react";

export default function AdminDashboardPage() {
    const { data: users, isLoading: usersLoading } = useCollection(useMemo(db => db ? collection(db, "users") : null, []));
    const { data: plans, isLoading: plansLoading } = useCollection<Plan>(useMemo(db => db ? collection(db, "plans") : null, []));
    const { data: domains, isLoading: domainsLoading } = useCollection(useMemo(db => db ? collection(db, "allowed_domains") : null, []));

    const activePlans = plans?.filter(p => p.status === 'active');

    const stats = [
        {
            title: "Total Users",
            value: users?.length ?? 0,
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
