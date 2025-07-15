import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/admin/data-table";
import { columns } from "@/components/admin/columns";

// Dummy data for demonstration
const dummyData = [
    { id: 'SUMMER24', name: '10% off for Summer', status: 'Active', discount: '10%', used: 152 },
    { id: 'WELCOME15', name: '15% off first month', status: 'Active', discount: '15%', used: 890 },
    { id: 'EXPIRED01', name: 'Old Promotion', status: 'Expired', discount: '20%', used: 2400 },
];

export default function AdminCouponsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Coupons</CardTitle>
        <CardDescription>Manage your coupons here.</CardDescription>
      </CardHeader>
       <CardContent>
        <DataTable columns={columns} data={dummyData} filterColumn="name" />
      </CardContent>
    </Card>
  );
}