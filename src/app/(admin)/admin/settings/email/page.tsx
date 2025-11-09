
'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function EmailSettingsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Email Settings</CardTitle>
                <CardDescription>Configure how your application sends email.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="from-name">From Name</Label>
                    <Input id="from-name" defaultValue="Temp Mailer" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="from-email">From Email</Label>
                    <Input id="from-email" type="email" defaultValue="noreply@tempmailer.com" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="driver">Mail Driver</Label>
                    <Select defaultValue="smtp">
                        <SelectTrigger id="driver">
                            <SelectValue placeholder="Select a mail driver" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="smtp">SMTP</SelectItem>
                            <SelectItem value="sendmail">Sendmail</SelectItem>
                            <SelectItem value="log">Log</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="header">Email Header</Label>
                    <Textarea id="header" placeholder="Enter HTML for email header" className="h-24"/>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="footer">Email Footer</Label>
                    <Textarea id="footer" placeholder="Enter HTML for email footer" className="h-24"/>
                </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
                <div className="flex justify-between w-full">
                    <Button variant="outline">Send Test Email</Button>
                    <Button>Save</Button>
                </div>
            </CardFooter>
        </Card>
    );
}
