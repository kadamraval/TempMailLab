
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDomainPage() {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Manage Domains</CardTitle>
          <CardDescription>View, add, and manage custom domains for premium users.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Domain management interface will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
