
"use client"
import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/admin/data-table";
import { getColumns } from "./columns";
import { CreateAdminForm } from "@/components/admin/create-admin-form";
import { Separator } from "@/components/ui/separator";
import type { User } from "@/types";
import { getUsers, updateUserAdminStatus } from "@/lib/actions/users";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function PermissionsPage() {
    const [users, setUsers] = React.useState<User[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const { toast } = useToast();

    const fetchUsers = React.useCallback(async () => {
        try {
            setLoading(true);
            const fetchedUsers = await getUsers();
            setUsers(fetchedUsers);
        } catch (err) {
            setError("Failed to fetch users. See console for details.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleUpdateAdminStatus = async (uid: string, isAdmin: boolean) => {
        const result = await updateUserAdminStatus(uid, isAdmin);
        if (result.success) {
            toast({
                title: "Success",
                description: `User status updated successfully.`,
            });
            fetchUsers(); // Re-fetch users to update the table
        } else {
            toast({
                title: "Error",
                description: result.error,
                variant: "destructive",
            });
        }
    };

    const columns = React.useMemo(() => getColumns(handleUpdateAdminStatus), [handleUpdateAdminStatus]);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Create New Admin</CardTitle>
                    <CardDescription>
                        Add a new administrator account. This user will have full access to the admin panel.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CreateAdminForm />
                </CardContent>
            </Card>

            <Separator />
            
            <Card>
                <CardHeader>
                    <CardTitle>User Permissions</CardTitle>
                    <CardDescription>Manage administrator privileges for all users.</CardDescription>
                </CardHeader>
                <CardContent>
                     {loading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                     ) : error ? (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                     ) : (
                        <DataTable columns={columns} data={users} filterColumn="email" />
                     )}
                </CardContent>
            </Card>
        </div>
    );
}
