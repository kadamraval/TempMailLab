
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminBlogPage() {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Manage Blog Posts</CardTitle>
          <CardDescription>Create, edit, and publish blog posts.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Blog post management interface will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
