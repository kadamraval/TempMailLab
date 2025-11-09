
'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function ApiSettingsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>API Settings</CardTitle>
                <CardDescription>Manage access and settings for the developer API.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="enable-api" className="text-base">Enable API</Label>
                        <p className="text-sm text-muted-foreground">
                            Allow users to generate and use API keys.
                        </p>
                    </div>
                    <Switch id="enable-api" defaultChecked />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="rate-limit">Rate Limit (Requests per minute)</Label>
                    <Input id="rate-limit" type="number" defaultValue="60" />
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
