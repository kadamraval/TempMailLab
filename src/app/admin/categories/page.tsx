import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/admin/data-table";
import { columns } from "@/components/admin/columns";

// Dummy data for demonstration
const dummyData = [
    { id: 'CAT-01', name: 'Privacy', status: 'Active', postCount: 5 },
    { id: 'CAT-02', name: 'Security', status: 'Active', postCount: 3 },
    { id: 'CAT-03', name: 'Product Updates', status: 'Active', postCount: 8 },
    { id: 'CAT-04', name: 'Guides', status: 'Archived', postCount: 2 },
];

export default function AdminCategoriesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Categories</CardTitle>
        <CardDescription>Manage your blog categories here.</CardDescription>
      </CardHeader>
       <CardContent>
        <DataTable columns={columns} data={dummyData} filterColumn="name" />
      </CardContent>
    </Card>
  );
}