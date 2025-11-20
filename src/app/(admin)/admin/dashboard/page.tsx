
'use client';
import { StatCard } from "@/components/admin/stat-card";
import { Activity, Users, Package, Globe, FlaskConical } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import type { Plan } from "../packages/data";
import { Button } from "@/components/ui/button";
import { testAdminSdkAction } from "@/lib/actions/testAdmin";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboardPage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const usersQuery = useMemoFirebase(() => firestore ? collection(firestore, "users") : null, [firestore]);
    const plansQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "plans"), where("status", "==", "active")) : null, [firestore]);
    const domainsQuery = useMemoFirebase(() => firestore ? collection(firestore, "allowed_domains") : null, [firestore]);

    const { data: users, isLoading: usersLoading } = useCollection(usersQuery);
    const { data: plans, isLoading: plansLoading } = useCollection<Plan>(plansQuery);
    const { data: domains, isLoading: domainsLoading } = useCollection(domainsQuery);

    const stats = [
        {
            title: "Total Users",
            value: users?.length ?? 0,
            icon: <Users className="h-4 w-4 text-muted-foreground" />,
            loading: usersLoading,
        },
        {
            title: "Active Plans",
            value: plans?.length ?? 0,
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

  const handleTestAdminSdk = async () => {
    toast({
      title: "Testing Admin SDK...",
      description: "Attempting to read a protected document.",
    });
    const result = await testAdminSdkAction();
    if (result.success) {
      toast({
        title: "SUCCESS: Admin SDK is working!",
        description: `Successfully read protected data: ${result.data}`,
      });
    } else {
      toast({
        title: "FAILURE: Admin SDK is NOT working.",
        description: `Error: ${result.error}`,
        variant: "destructive",
      });
    }
  };

  return (
    <>
        <div className="flex justify-end mb-4">
            <Button onClick={handleTestAdminSdk}>
                <FlaskConical className="mr-2 h-4 w-4" />
                Test Admin SDK
            </Button>
        </div>
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
