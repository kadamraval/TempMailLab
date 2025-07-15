import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/admin/data-table";
import { columns } from "@/components/admin/columns";

// Dummy data for demonstration
const dummyData = [
    { id: 'hero-section', name: 'Homepage Hero', status: 'Active', page: 'Home' },
    { id: 'features-list', name: 'Features List', status: 'Active', page: 'Home' },
    { id: 'pricing-table', name: 'Pricing Table', status: 'Active', page: 'Pricing' },
    { id: 'faq-accordion', name: 'FAQ Accordion', status: 'Inactive', page: 'FAQ' },
];

export default function AdminSectionsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sections</CardTitle>
        <CardDescription>Manage your page sections here.</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={dummyData} filterColumn="name" />
      </CardContent>
    </Card>
  );
}