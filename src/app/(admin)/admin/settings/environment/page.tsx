
'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EnvironmentSettingsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Environment</CardTitle>
                <CardDescription>Manage your environment name.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="environment-name">Environment name</Label>
                    <Input id="environment-name" placeholder="Enter your environment name (e.g. prod)" />
                </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4 flex justify-between items-center">
                <div>
                     <Button variant="destructive-outline">Delete backend</Button>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">Cancel</Button>
                    <Button>Save</Button>
                </div>
            </CardFooter>
        </Card>
    );
}
