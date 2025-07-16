
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function EmailSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Settings</CardTitle>
        <CardDescription>Configure your application's email sending service.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
            <Label htmlFor="from-email">"From" Email Address</Label>
            <Input id="from-email" type="email" placeholder="noreply@example.com" />
            <p className="text-sm text-muted-foreground">The email address system notifications will be sent from.</p>
        </div>
        <Separator />
        <div className="space-y-2">
            <Label htmlFor="smtp-host">SMTP Host</Label>
            <Input id="smtp-host" placeholder="smtp.mailgun.org" />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="smtp-port">SMTP Port</Label>
                <Input id="smtp-port" placeholder="587" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="smtp-user">SMTP Username</Label>
                <Input id="smtp-user" placeholder="your-smtp-username" />
            </div>
        </div>
         <div className="space-y-2">
            <Label htmlFor="smtp-pass">SMTP Password</Label>
            <Input id="smtp-pass" type="password" placeholder="your-smtp-password" />
        </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-4 flex justify-between">
        <Button variant="outline">Send Test Email</Button>
        <Button>Save Changes</Button>
      </CardFooter>
    </Card>
  );
}
