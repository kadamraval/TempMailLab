import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function PagesSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pages Settings</CardTitle>
        <CardDescription>Manage settings related to content pages.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Page-related configurations will be available here.</p>
      </CardContent>
    </Card>
  );
}
