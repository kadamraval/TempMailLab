
'use client';
import { useEffect, useState } from "react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, getCountFromServer } from "firebase/firestore";
import { StatCard } from "@/components/admin/stat-card";
import { Activity, Users, Package, Globe } from "lucide-react";
import type { Plan } from "./packages/data";
import { seedDefaultPlan } from "./packages/seed";

export default function AdminDashboardPage() {
    const firestore = useFirestore();
    const [userCount, setUserCount] = useState(0);
    const [userCountLoading, setUserCountLoading] = useState(true);
    
    useEffect(() => {
        // Ensure the default plan exists on admin dashboard load.
        seedDefaultPlan();
    }, []);
    
    useEffect(() => {
        if (!firestore) return;
        const fetchUserCount = async () => {
            setUserCountLoading(true);
            try {
                // This is an admin-only operation, but we'll use getCountFromServer for performance.
                // In a real production app, this might be a server-side-only fetch.
                const usersCol = collection(firestore, "users");
                const snapshot = await getCountFromServer(usersCol);
                setUserCount(snapshot.data().count);
            } catch (error) {
                console.error("Error fetching user count (permissions may be restrictive):", error);
                setUserCount(0); // Set to 0 on error
            } finally {
                setUserCountLoading(false);
            }
        };
        fetchUserCount();
    }, [firestore]);


    const plansQuery = useMemoFirebase(() => firestore ? collection(firestore, "plans") : null, [firestore]);
    const { data: plans, isLoading: plansLoading } = useCollection<Plan>(plansQuery);
    
    const domainsQuery = useMemoFirebase(() => firestore ? collection(firestore, "allowed_domains") : null, [firestore]);
    const { data: domains, isLoading: domainsLoading } = useCollection(domainsQuery);

    const activePlans = plans?.filter(p => p.status === 'active');

    const stats = [
        {
            title: "Total Users",
            value: userCount,
            icon: <Users className="h-4 w-4 text-muted-foreground" />,
            loading: userCountLoading,
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
