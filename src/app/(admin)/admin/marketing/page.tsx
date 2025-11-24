
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminMarketingPage() {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Marketing Campaigns</CardTitle>
          <CardDescription>Manage newsletters and marketing campaigns.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Marketing campaign interface will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
