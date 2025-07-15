import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/admin/data-table";
import { columns } from "@/components/admin/columns";

// Dummy data for demonstration
const dummyData = [
    { id: 'free-tier', name: 'Free', status: 'Active', price: '$0/mo', subscribers: 10234 },
    { id: 'pro-tier', name: 'Pro', status: 'Active', price: '$5/mo', subscribers: 489 },
    { id: 'enterprise-tier', name: 'Enterprise', status: 'Archived', price: 'Contact Us', subscribers: 12 },
];

export default function AdminPlansPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Plans</CardTitle>
        <CardDescription>Manage your pricing plans here.</CardDescription>
      </CardHeader>
       <CardContent>
        <DataTable columns={columns} data={dummyData} filterColumn="name" />
      </CardContent>
    </Card>
  );
}