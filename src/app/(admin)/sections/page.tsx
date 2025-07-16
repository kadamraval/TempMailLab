
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/admin/data-table";
import { columns } from "@/components/admin/columns";

// Dummy data for demonstration
const dummyData = [
    { id: 'hero-section', name: 'Homepage Hero', status: 'Active', page: '/', type: 'Hero' },
    { id: 'features-section', name: 'Homepage Features', status: 'Active', page: '/', type: 'Grid' },
    { id: 'faq-section', name: 'Homepage FAQ', status: 'Active', page: '/', type: 'Accordion' },
    { id: 'about-header', name: 'About Page Header', status: 'Inactive', page: '/about', type: 'Header' },
];

export default function AdminSectionsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sections</CardTitle>
        <CardDescription>Manage reusable content sections for your pages.</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={dummyData} filterColumn="name" />
      </CardContent>
    </Card>
  );
}
