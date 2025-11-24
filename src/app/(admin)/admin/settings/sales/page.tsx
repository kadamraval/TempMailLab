
'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function SalesSettingsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Sales & Billing</CardTitle>
                <CardDescription>Configure payment gateways and sales settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="currency">Default Currency</Label>
                    <Input id="currency" defaultValue="USD" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="tax-rate">Default Tax Rate (%)</Label>
                    <Input id="tax-rate" type="number" defaultValue="0" />
                </div>
                 <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="enable-invoicing" className="text-base">Enable Invoicing</Label>
                        <p className="text-sm text-muted-foreground">
                            Allow users to download invoices for their payments.
                        </p>
                    </div>
                    <Switch id="enable-invoicing" defaultChecked />
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
