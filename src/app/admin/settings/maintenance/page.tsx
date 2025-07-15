import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function MaintenanceSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Maintenance Mode</CardTitle>
        <CardDescription>Enable or disable maintenance mode for the site.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Options for site maintenance will be available here.</p>
      </CardContent>
    </Card>
  );
}
