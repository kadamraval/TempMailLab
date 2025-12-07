
"use client";

import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { AudienceChart } from "./audience-chart";
import { TopPagesTable } from "./top-pages-table";
import { AudienceGeo } from "./audience-geo";
import { DeviceChart } from "./device-chart";

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
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
            <Card className="xl:col-span-2">
                <CardHeader>
                    <CardTitle>Audience Over Time</CardTitle>
                    <CardDescription>
                        Unique visitors to your application over the last 30 days.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <AudienceChart />
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
             <Card className="xl:col-span-2">
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
        </div>
    )
}

    