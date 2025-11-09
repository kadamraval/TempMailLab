
"use client"
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function SettingsGeneralPage() {
    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>Update your site's details and general configuration.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="site-title">Site Title</Label>
                        <Input id="site-title" defaultValue="Temp Mailer" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="site-description">Site Description</Label>
                        <Textarea id="site-description" defaultValue="Generate temporary email addresses for private, secure browsing." />
                    </div>
                    <div className="space-y-2">
                         <Label htmlFor="timezone">Timezone</Label>
                        <Select>
                            <SelectTrigger id="timezone">
                                <SelectValue placeholder="Select a timezone" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="utc-12">(UTC-12:00) International Date Line West</SelectItem>
                                <SelectItem value="utc-11">(UTC-11:00) Coordinated Universal Time-11</SelectItem>
                                <SelectItem value="utc-8">(UTC-08:00) Pacific Time (US & Canada)</SelectItem>
                                <SelectItem value="utc-5">(UTC-05:00) Eastern Time (US & Canada)</SelectItem>
                                <SelectItem value="utc+1">(UTC+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna</SelectItem>
                                <SelectItem value="utc+5.5">(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi</SelectItem>
                                <SelectItem value="utc+8">(UTC+08:00) Beijing, Perth, Singapore, Hong Kong</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                     <div className="flex justify-end w-full">
                        <Button>Save</Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
