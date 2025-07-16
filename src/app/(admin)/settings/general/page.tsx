
// @/app/admin/settings/general/page.tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function GeneralSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>Manage general settings for your application.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
            <Label htmlFor="site-name">Site Name</Label>
            <Input id="site-name" defaultValue="Temp Mailer" />
            <p className="text-sm text-muted-foreground">This is the name of your site, it will be used in the title and other places.</p>
        </div>
        <Separator />
         <div className="space-y-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input id="tagline" defaultValue="Your Private, Temporary Inbox" />
             <p className="text-sm text-muted-foreground">A short description of your site.</p>
        </div>
        <Separator />
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="maintenance-mode" className="text-base">Enable User Registration</Label>
            <p className="text-sm text-muted-foreground">
              Allow new users to sign up for an account.
            </p>
          </div>
          <Switch id="registration-switch" defaultChecked/>
        </div>

      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <Button>Save Changes</Button>
      </CardFooter>
    </Card>
  );
}
