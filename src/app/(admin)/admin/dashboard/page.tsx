
'use client';
import { StatCard } from "@/components/admin/stat-card";
import { Activity, Users, Package, Globe } from "lucide-react";

export default function AdminDashboardPage() {
    const stats = [
        {
            title: "Total Users",
            value: 0,
            icon: <Users className="h-4 w-4 text-muted-foreground" />,
            loading: true,
        },
        {
            title: "Active Plans",
            value: 0,
            icon: <Package className="h-4 w-4 text-muted-foreground" />,
            loading: true,
        },
        {
            title: "Allowed Domains",
            value: 0,
            icon: <Globe className="h-4 w-4 text-muted-foreground" />,
            loading: true,
        },
        {
            title: "API Status",
            value: "...",
            icon: <Activity className="h-4 w-4 text-muted-foreground" />,
            loading: true,
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
