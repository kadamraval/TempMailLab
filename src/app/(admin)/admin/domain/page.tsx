
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/admin/data-table";
import { blockedDomainColumns } from "./blocked-columns";
import { allowedDomainColumns } from "./allowed-columns";
import { Loader2 } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import type { AllowedDomain } from "./allowed-columns";
import type { BlockedDomain } from "./blocked-columns";

export default function AdminDomainPage() {
    const firestore = useFirestore();

    const allowedDomainsQuery = useMemoFirebase(() => collection(firestore, "allowed_domains"), [firestore]);
    const blockedDomainsQuery = useMemoFirebase(() => collection(firestore, "blocked_domains"), [firestore]);
    
    const { data: allowedDomains, isLoading: isLoadingAllowed } = useCollection<AllowedDomain>(allowedDomainsQuery);
    const { data: blockedDomains, isLoading: isLoadingBlocked } = useCollection<BlockedDomain>(blockedDomainsQuery);

    const loading = isLoadingAllowed || isLoadingBlocked;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

  return (
    <Card>
        <CardHeader>
            <CardTitle>Domain Management</CardTitle>
            <CardDescription>
                Manage allowed domains for generating temporary emails and blocked domains for spam filtering.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="allowed">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="allowed">Allowed Domains</TabsTrigger>
                    <TabsTrigger value="blocked">Blocked Domains</TabsTrigger>
                </TabsList>
                <TabsContent value="allowed">
                    <Card>
                        <CardHeader>
                            <CardTitle>Allowed Domains</CardTitle>
                            <CardDescription>Domains used by the system to generate temporary email addresses.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataTable columns={allowedDomainColumns} data={allowedDomains || []} filterColumn="domain" />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="blocked">
                     <Card>
                        <CardHeader>
                            <CardTitle>Blocked Domains</CardTitle>
                            <CardDescription>Emails from these domains will be rejected by the system.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataTable columns={blockedDomainColumns} data={blockedDomains || []} filterColumn="domain" />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </CardContent>
    </Card>
  );
}
