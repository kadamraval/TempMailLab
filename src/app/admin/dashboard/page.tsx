import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
            <CardDescription>Number of registered users.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">1,234</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Packages</CardTitle>
            <CardDescription>Number of available packages.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">5</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Coupons</CardTitle>
            <CardDescription>Number of active coupons.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">25</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ad Impressions</CardTitle>
            <CardDescription>Total ad views this month.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">5M+</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
