
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/admin/data-table";
import { blockedDomainColumns } from "./blocked-columns";
import { allowedDomainColumns } from "./allowed-columns";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

// Mock data - in a real app, this would come from a database
const sampleBlockedDomains = [
    { id: "1", domain: "spam-source.com", createdAt: new Date().toISOString() },
    { id: "2", domain: "unwanted-mailer.net", createdAt: new Date().toISOString() },
    { id: "3", domain: "evil-corp.org", createdAt: new Date().toISOString() },
];

const sampleAllowedDomains = [
    { id: "1", domain: "temp-inbox.app", description: "Default domain for free users", createdAt: new Date().toISOString() },
    { id: "2", domain: "mail-shield.io", description: "Premium user domain", createdAt: new Date().toISOString() },
];

export default function AdminDomainPage() {
    const [loading, setLoading] = useState(true);

    // Simulate data fetching
    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

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
                            <DataTable columns={allowedDomainColumns} data={sampleAllowedDomains} filterColumn="domain" />
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
                            <DataTable columns={blockedDomainColumns} data={sampleBlockedDomains} filterColumn="domain" />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </CardContent>
    </Card>
  );
}
