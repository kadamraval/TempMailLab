
// @/app/admin/settings/maintenance/page.tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function MaintenanceSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Maintenance Mode</CardTitle>
        <CardDescription>Control your site's availability for maintenance.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="maintenance-mode" className="text-base">Enable Maintenance Mode</Label>
            <p className="text-sm text-muted-foreground">
              When enabled, visitors will see a maintenance page instead of your site. Admins will still be able to access the site.
            </p>
          </div>
          <Switch id="maintenance-mode" />
        </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <Button>Save Changes</Button>
      </CardFooter>
    </Card>
  );
}
