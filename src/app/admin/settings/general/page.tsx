import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function GeneralSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>Manage general site settings.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Options for site title, favicon, and other general configurations will be here.</p>
      </CardContent>
    </Card>
  );
}
