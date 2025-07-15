// @/app/admin/inbox/page.tsx
"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/admin/data-table";
import { columns } from "./columns";
import { useInboxLogs } from "@/hooks/useInboxLogs";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminInboxPage() {
  const { logs, loading, error, isFirebaseConfigured } = useInboxLogs();

  if (!isFirebaseConfigured) {
    return (
       <Card>
        <CardHeader>
            <CardTitle>Inbox Logs</CardTitle>
            <CardDescription>Monitor user inboxes here. This is running on dummy data.</CardDescription>
        </Header>
        <CardContent>
            <div className="mb-4 flex flex-col items-center justify-center gap-4 p-8 text-center bg-muted/50 rounded-lg">
                <AlertTriangle className="h-12 w-12 text-destructive" />
                <h3 className="text-xl font-semibold">Firebase Not Configured</h3>
                <p className="text-muted-foreground max-w-md">
                    Inbox monitoring requires a Firebase connection. Please add your Firebase client and admin credentials in your environment file to see live data.
                </p>
                <Button asChild>
                    <Link href="/admin/settings/integrations/firebase">Go to Settings</Link>
                </Button>
            </div>
             <DataTable columns={columns} data={[]} filterColumn="userId" />
        </CardContent>
      </Card>
    );
  }

  if (loading) {
     return (
        <Card>
            <CardHeader>
                <CardTitle>Inbox Logs</CardTitle>
                <CardDescription>Monitor user inboxes here.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex justify-between items-center gap-2 py-4 flex-wrap">
                        <Skeleton className="h-10 w-full sm:w-64" />
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Skeleton className="h-10 w-24" />
                            <Skeleton className="h-10 w-24" />
                        </div>
                    </div>
                    <Skeleton className="h-[500px] w-full rounded-md" />
                </div>
            </CardContent>
        </Card>
     )
  }

  if (error) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Error</CardTitle>
                <CardDescription>Could not load inbox logs.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-destructive">{error}</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inbox Logs</CardTitle>
        <CardDescription>Real-time view of temporary inboxes being created.</CardDescription>
      </CardHeader>
       <CardContent>
        <DataTable columns={columns} data={logs} filterColumn="email" />
      </CardContent>
    </Card>
  );
}
