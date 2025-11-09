
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminUsersPage() {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Manage Users</CardTitle>
          <CardDescription>View, edit, and manage all registered users.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>User management interface will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
