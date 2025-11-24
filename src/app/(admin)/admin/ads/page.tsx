
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminAdsPage() {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Manage Ads</CardTitle>
          <CardDescription>Configure and manage advertisements for the free tier.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Advertisement management interface will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
