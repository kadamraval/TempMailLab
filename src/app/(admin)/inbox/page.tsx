
// @/app/admin/inbox/page.tsx
"use client"

import * as React from "react"
import { useInboxLogs } from "@/hooks/useInboxLogs"
import { getColumns } from "./columns"
import { DataTable } from "@/components/admin/data-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

function InboxPageClient() {
    const { logs, loading, error, isFirebaseConfigured } = useInboxLogs();
    const { toast } = useToast()

    const handleAction = async (action: () => Promise<{success: boolean; error?: string}>, successMessage: string) => {
        const result = await action();
        if (result.success) {
            toast({ title: "Success", description: successMessage });
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
    };
    
    const columns = React.useMemo(() => getColumns(handleAction), [handleAction]);

    if (!isFirebaseConfigured && !loading) {
         return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Firebase Not Configured</AlertTitle>
                <AlertDescription>
                    The client-side Firebase configuration is missing. Please check your environment variables and the console for more details. Real-time inbox logs cannot be displayed.
                </AlertDescription>
            </Alert>
        )
    }
    
    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-80" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
             <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Loading Logs</AlertTitle>
                <AlertDescription>
                    {error}
                </AlertDescription>
            </Alert>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Inbox Logs</CardTitle>
                <CardDescription>A real-time log of all temporary inboxes created.</CardDescription>
            </CardHeader>
            <CardContent>
                <DataTable columns={columns} data={logs} filterColumn="email" />
            </CardContent>
        </Card>
    );
}

export default function InboxPage() {
    return <InboxPageClient />;
}
