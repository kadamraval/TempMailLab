
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function SalesSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Settings</CardTitle>
        <CardDescription>Configure sales and billing settings.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Sales-related configurations like currency and payment gateways will be available here.</p>
      </CardContent>
    </Card>
  );
}
