
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function SystemInfoPage() {

    const systemInfo = {
        "PHP Version": "8.2.1",
        "Laravel Version": "10.10",
        "Database Driver": "mysql",
        "Cache Driver": "file",
        "Queue Driver": "sync",
        "Session Driver": "file",
        "Server Software": "nginx/1.21.3",
        "OS": "Linux",
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>System Information</CardTitle>
                <CardDescription>Details about your application's server environment.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Attribute</TableHead>
                            <TableHead>Value</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Object.entries(systemInfo).map(([key, value]) => (
                            <TableRow key={key}>
                                <TableCell className="font-medium">{key}</TableCell>
                                <TableCell>{value}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
