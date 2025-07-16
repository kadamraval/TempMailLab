
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";

export default function SystemPage() {
    // In a real app, these values would come from server-side checks
    const checks = [
        { name: "PHP Version", status: true, detail: "8.2.1" },
        { name: "MySQL Connection", status: true, detail: "Connected" },
        { name: "Redis Connection", status: true, detail: "Connected" },
        { name: "Cron Job Running", status: true, detail: "Last run: 2 minutes ago" },
        { name: "SMTP Configuration", status: false, detail: "Not configured" },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Check the health and status of your application's core components.</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-3">
                    {checks.map((check) => (
                        <li key={check.name} className="flex items-center justify-between p-3 border rounded-md">
                            <div className="flex items-center gap-3">
                                {check.status ? (
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-red-500" />
                                )}
                                <span className="font-medium">{check.name}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">{check.detail}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}
