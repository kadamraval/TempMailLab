import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function CacheSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cache Settings</CardTitle>
        <CardDescription>Manage application caching behavior.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Options for clearing and configuring cache will be available here.</p>
      </CardContent>
    </Card>
  );
}
