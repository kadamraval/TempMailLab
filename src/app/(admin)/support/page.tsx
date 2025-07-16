
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/admin/data-table";
import { columns } from "@/components/admin/columns";

// Dummy data for demonstration
const dummyData = [
    { id: 'TKT-001', name: 'Cannot login', status: 'Open', user: 'user1@example.com', priority: 'High' },
    { id: 'TKT-002', name: 'Billing question', status: 'Closed', user: 'user2@example.com', priority: 'Medium' },
    { id: 'TKT-003', name: 'Feature request', status: 'On Hold', user: 'user3@example.com', priority: 'Low' },
];

export default function AdminSupportPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Support</CardTitle>
        <CardDescription>Manage your support tickets and queries here.</CardDescription>
      </CardHeader>
       <CardContent>
        <DataTable columns={columns} data={dummyData} filterColumn="name" />
      </CardContent>
    </Card>
  );
}
