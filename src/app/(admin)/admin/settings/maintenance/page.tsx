
'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export default function MaintenanceSettingsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Maintenance Mode</CardTitle>
                <CardDescription>Control your site's availability for maintenance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="maintenance-mode" className="text-base">Enable Maintenance Mode</Label>
                        <p className="text-sm text-muted-foreground">
                            When enabled, only admins will be able to access the site.
                        </p>
                    </div>
                    <Switch id="maintenance-mode" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="maintenance-message">Maintenance Message</Label>
                    <Textarea id="maintenance-message" placeholder="We are currently undergoing scheduled maintenance. Please check back soon." />
                </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
                <div className="flex justify-end w-full">
                    <Button>Save</Button>
                </div>
            </CardFooter>
        </Card>
    );
}
