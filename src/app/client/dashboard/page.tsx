import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function ClientDashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Client Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Active Domains</CardTitle>
            <CardDescription>Your configured custom domains.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">2</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Emails Received</CardTitle>
            <CardDescription>Total emails this month.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">1,402</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>Your current plan.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">Premium</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
