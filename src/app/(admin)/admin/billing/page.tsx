
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminBillingPage() {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Billing & Invoices</CardTitle>
          <CardDescription>View and manage all billing activities and invoices.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Billing and invoice management interface will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
