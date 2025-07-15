import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function AppearanceSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Customize the look and feel of your application.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Theme settings and color options will be available here.</p>
      </CardContent>
    </Card>
  );
}
