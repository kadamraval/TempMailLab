import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function ApiSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>API Settings</CardTitle>
        <CardDescription>Manage API keys and access permissions.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>API configuration options will be available here.</p>
      </CardContent>
    </Card>
  );
}
