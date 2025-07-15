import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/admin/data-table";
import { columns } from "@/components/admin/columns";

// Dummy data for demonstration
const dummyData = [
    { id: 'CAMP-01', name: 'Welcome Email Series', status: 'Active', type: 'Email', audience: 'New Users' },
    { id: 'CAMP-02', name: 'Q3 Social Media Push', status: 'Completed', type: 'Social', audience: 'All Users' },
    { id: 'CAMP-03', name: 'Win-back Campaign', status: 'Draft', type: 'Email', audience: 'Churned Users' },
];

export default function AdminMarketingPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Marketing</CardTitle>
        <CardDescription>Manage your marketing campaigns here.</CardDescription>
      </CardHeader>
       <CardContent>
        <DataTable columns={columns} data={dummyData} filterColumn="name" />
      </CardContent>
    </Card>
  );
}