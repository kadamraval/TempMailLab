import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/admin/data-table";
import { columns } from "@/components/admin/columns";

// Dummy data for demonstration
const dummyData = [
  { id: 'INV-123', name: 'John Doe', status: 'Paid', amount: '$15.00', date: '2024-07-15' },
  { id: 'INV-124', name: 'Jane Smith', status: 'Pending', amount: '$5.00', date: '2024-07-18' },
  { id: 'INV-125', name: 'Sam Wilson', status: 'Paid', amount: '$5.00', date: '2024-07-20' },
  { id: 'INV-126', name: 'Alex Ray', status: 'Overdue', amount: '$15.00', date: '2024-06-10' },
];

export default function AdminBillingPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing</CardTitle>
        <CardDescription>Manage your billing and sales data here.</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={dummyData} filterColumn="name" />
      </CardContent>
    </Card>
  );
}