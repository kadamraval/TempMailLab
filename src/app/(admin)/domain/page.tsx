
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/admin/data-table";
import { columns } from "@/components/admin/columns";

// Dummy data for demonstration
const dummyData = [
  { id: 'example.com', name: 'example.com', status: 'Active', provider: 'mail.tm' },
  { id: 'test.net', name: 'test.net', status: 'Active', provider: 'mail.tm' },
  { id: 'temp.org', name: 'temp.org', status: 'Inactive', provider: 'mail.tm' },
];

export default function AdminDomainPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Domains</CardTitle>
        <CardDescription>Manage your domains here.</CardDescription>
      </CardHeader>
       <CardContent>
        <DataTable columns={columns} data={dummyData} filterColumn="name" />
      </CardContent>
    </Card>
  );
}
