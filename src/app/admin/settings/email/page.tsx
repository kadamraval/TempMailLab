import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function EmailSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Settings</CardTitle>
        <CardDescription>Configure email templates and sending services.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Email configuration options will be available here.</p>
      </CardContent>
    </Card>
  );
}
