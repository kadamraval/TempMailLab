
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/admin/data-table";
import { columns } from "@/components/admin/columns";

// Dummy data for demonstration
const dummyData = [
    { id: 'cat-1', name: 'Privacy', status: 'Active', postCount: 5 },
    { id: 'cat-2', name: 'Security', status: 'Active', postCount: 8 },
    { id: 'cat-3', name: 'Product Updates', status: 'Active', postCount: 12 },
    { id: 'cat-4', name: 'Guides', status: 'Archived', postCount: 3 },
];

export default function AdminCategoriesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Categories</CardTitle>
        <CardDescription>Manage blog post categories.</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={dummyData} filterColumn="name" />
      </CardContent>
    </Card>
  );
}
