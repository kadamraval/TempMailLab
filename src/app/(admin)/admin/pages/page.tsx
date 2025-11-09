
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminPagesPage() {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Manage Pages</CardTitle>
          <CardDescription>Edit content for static pages like 'About Us' or 'FAQ'.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Page management interface will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
