import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function SystemSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Information</CardTitle>
        <CardDescription>View system status and server information.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>System health checks and environment details will be shown here.</p>
      </CardContent>
    </Card>
  );
}
