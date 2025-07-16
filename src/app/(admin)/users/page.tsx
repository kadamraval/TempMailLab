
// @/app/admin/users/page.tsx
"use client"
import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/admin/data-table";
import { columns } from "./columns";
import { getUsers } from '@/lib/actions/users';
import type { User } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export default function UsersPage() {
  const [data, setData] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchData() {
      try {
        const users = await getUsers();
        setData(users);
      } catch (err) {
         setError("Failed to fetch users. See console for details.");
         console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

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
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
     )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>Manage all registered users in the system.</CardDescription>
      </CardHeader>
       <CardContent>
        <DataTable columns={columns} data={data} filterColumn="email" />
      </CardContent>
    </Card>
  );
}
