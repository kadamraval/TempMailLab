import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/admin/data-table";
import { columns } from "@/components/admin/columns";

// Dummy data for demonstration
const dummyData = [
    { id: 'BLG-001', name: 'The Importance of Digital Privacy', status: 'Published', author: 'Jane Doe', date: '2024-07-15' },
    { id: 'BLG-002', name: 'Top 5 Use Cases for a Temp Email', status: 'Published', author: 'John Smith', date: '2024-07-10' },
    { id: 'BLG-003', name: 'How We Keep Your Data Secure', status: 'Draft', author: 'Alex Ray', date: '2024-07-05' },
];

export default function AdminBlogPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Blogs</CardTitle>
        <CardDescription>Manage your blog posts here.</CardDescription>
      </CardHeader>
       <CardContent>
        <DataTable columns={columns} data={dummyData} filterColumn="name" />
      </CardContent>
    </Card>
  );
}