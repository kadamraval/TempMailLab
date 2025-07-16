import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
          <CardDescription>Welcome to the admin area.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This is a placeholder for the admin dashboard content. You can manage users, plans, and settings from here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
