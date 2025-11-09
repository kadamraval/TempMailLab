
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminCategoriesPage() {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Manage Categories</CardTitle>
          <CardDescription>Organize blog posts into categories.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Category management interface will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
