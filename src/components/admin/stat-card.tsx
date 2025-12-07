
"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    loading?: boolean;
    change?: string;
    changeType?: 'positive' | 'negative';
}

export function StatCard({ title, value, icon, loading, change, changeType }: StatCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                {loading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                    <>
                        <div className="text-2xl font-bold">{value}</div>
                         {change && (
                            <p className="text-xs text-muted-foreground flex items-center">
                                <span className={cn("flex items-center gap-1", changeType === 'positive' ? 'text-emerald-500' : 'text-red-500')}>
                                    {changeType === 'positive' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                    {change}
                                </span>
                                <span className="ml-1">from last month</span>
                            </p>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
