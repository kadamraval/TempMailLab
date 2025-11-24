
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSectionsPage() {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Manage Page Sections</CardTitle>
          <CardDescription>Edit reusable sections for the landing page.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Page section management interface will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
