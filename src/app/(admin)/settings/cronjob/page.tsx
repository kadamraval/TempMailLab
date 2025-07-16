
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function CronjobSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cronjob Settings</CardTitle>
        <CardDescription>Manage scheduled tasks and cronjobs.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Settings for automated tasks will be available here.</p>
      </CardContent>
    </Card>
  );
}
