
"use client";

import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowUp, BarChart, CalendarIcon, Loader2, Users } from "lucide-react";
import { AudienceChart } from "./audience-chart";
import { TopPagesTable } from "./top-pages-table";
import { AudienceGeo } from "./audience-geo";
import { DeviceChart } from "./device-chart";
import { DateRangePicker } from "./date-range-picker";
import { NewVsReturningChart } from "./new-vs-returning-chart";
import { TrafficSourceChart } from "./traffic-source-chart";
import { StatCard } from "../stat-card";


export function AnalyticsDashboard() {
    const firestore = useFirestore();
    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'admin_settings', 'google-analytics') : null, [firestore]);
    const { isLoading } = useDoc(settingsRef);

    if (isLoading) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Analytics Overview</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-bold tracking-tight">Analytics Overview</h2>
                <DateRangePicker />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                 <StatCard title="Total Users" value="1,254" icon={<Users className="h-4 w-4 text-muted-foreground" />} change="+12.5%" changeType="positive" />
                 <StatCard title="Bounce Rate" value="62.1%" icon={<BarChart className="h-4 w-4 text-muted-foreground" />} change="-2.1%" changeType="negative" />
                 <StatCard title="Avg. Session" value="2m 15s" icon={<CalendarIcon className="h-4 w-4 text-muted-foreground" />} change="+5.8%" changeType="positive" />
                 <StatCard title="New Users" value="802" icon={<Users className="h-4 w-4 text-muted-foreground" />} />
            </div>

            <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
                <Card className="xl:col-span-2">
                    <CardHeader>
                        <CardTitle>Audience Over Time</CardTitle>
                        <CardDescription>
                            Unique visitors to your application over the selected period.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <AudienceChart />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>New vs. Returning</CardTitle>
                        <CardDescription>
                            Breakdown of new and returning visitors.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <NewVsReturningChart />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Top Pages</CardTitle>
                        <CardDescription>
                            Your most viewed pages.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TopPagesTable />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Traffic Source</CardTitle>
                        <CardDescription>
                            How visitors are finding your site.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TrafficSourceChart />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Device Breakdown</CardTitle>
                        <CardDescription>
                            How your visitors are accessing your site.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DeviceChart />
                    </CardContent>
                </Card>
                 <Card className="xl:col-span-3">
                    <CardHeader>
                        <CardTitle>Audience by Location</CardTitle>
                        <CardDescription>
                            Your top visitor locations by country.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AudienceGeo />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
