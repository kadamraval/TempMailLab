import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/admin/data-table";
import { columns } from "@/components/admin/columns";

// Dummy data for demonstration
const dummyData = [
    { id: '/about', name: 'About Us', status: 'Published', lastModified: '2024-07-01' },
    { id: '/contact', name: 'Contact Us', status: 'Published', lastModified: '2024-06-25' },
    { id: '/terms', name: 'Terms of Service', status: 'Published', lastModified: '2024-07-15' },
    { id: '/new-feature', name: 'New Feature (Draft)', status: 'Draft', lastModified: '2024-07-20' },
];

export default function AdminPagesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pages</CardTitle>
        <CardDescription>Manage your pages here.</CardDescription>
      </CardHeader>
       <CardContent>
        <DataTable columns={columns} data={dummyData} filterColumn="name" />
      </CardContent>
    </Card>
  );
}