
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/admin/data-table";
import { columns } from "@/components/admin/columns";

// Dummy data for demonstration
const dummyData = [
    { id: 'post-1', name: 'The Importance of Digital Privacy in 2024', status: 'Published', author: 'Jane Doe', date: '2024-07-15' },
    { id: 'post-2', name: 'Top 5 Use Cases for a Temporary Email Address', status: 'Published', author: 'John Smith', date: '2024-07-10' },
    { id: 'post-3', name: 'How We Keep Your Data Secure', status: 'Draft', author: 'Alex Ray', date: '2024-07-05' },
];

export default function AdminBlogPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Blog Management</CardTitle>
        <CardDescription>Create, edit, and manage your blog posts here.</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={dummyData} filterColumn="name" />
      </CardContent>
    </Card>
  );
}
