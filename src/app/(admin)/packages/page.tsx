
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/admin/data-table";
import { columns } from "@/components/admin/columns";

// Dummy data for demonstration
const dummyData = [
    { id: 'free-plan', name: 'Free', status: 'Active', price: '$0/mo', features: 3 },
    { id: 'pro-plan', name: 'Pro', status: 'Active', price: '$5/mo', features: 6 },
    { id: 'business-plan', name: 'Business', status: 'Hidden', price: '$25/mo', features: 10 },
];

export default function AdminPackagesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pricing Plans</CardTitle>
        <CardDescription>Manage your pricing plans and features.</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={dummyData} filterColumn="name" />
      </CardContent>
    </Card>
  );
}
