"use client";

import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, TrendingUp, Settings } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AudienceChart } from "./audience-chart";
import { TopPagesTable } from "./top-pages-table";
import { AudienceGeo } from "./audience-geo";
import { DeviceChart } from "./device-chart";

export function AnalyticsDashboard() {
    const firestore = useFirestore();
    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'admin_settings', 'google-analytics') : null, [firestore]);
    const { data: settings, isLoading } = useDoc(settingsRef);

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

    if (!settings?.measurementId) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Analytics Overview</CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <TrendingUp className="h-4 w-4" />
                        <AlertTitle>Google Analytics Not Connected</AlertTitle>
                        <AlertDescription>
                            To view detailed audience and traffic metrics, please connect your Google Analytics account.
                            <Button asChild variant="link" className="p-0 h-auto ml-1">
                                <Link href="/admin/settings/integrations/google-analytics">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Configure Now
                                </Link>
                            </Button>
                        </AlertDescription>
                    </Alert>
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
