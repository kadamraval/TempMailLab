
'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CronjobSettingsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Cronjob Settings</CardTitle>
                <CardDescription>Configure scheduled tasks for your application.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <p className="text-sm text-muted-foreground">Use the following command to run scheduled jobs. Your server's cron manager should be configured to run this command every minute.</p>
                <Input readOnly value="* * * * * curl https://your-domain.com/api/cron" />
                 <Button variant="outline">Generate New Cron URL</Button>
            </CardContent>
             <CardFooter className="border-t px-6 py-4">
                <p className="text-xs text-muted-foreground">
                    Last run: 5 minutes ago.
                </p>
            </CardFooter>
        </Card>
    );
}
