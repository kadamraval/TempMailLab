import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/admin/data-table";
import { columns } from "@/components/admin/columns";

// Dummy data for demonstration
const dummyData = [
    { id: 'AD-001', name: 'Summer Sale Banner', status: 'Active', impressions: 150000, clicks: 2300 },
    { id: 'AD-002', name: 'New Product Launch Video', status: 'Inactive', impressions: 0, clicks: 0 },
    { id: 'AD-003', name: 'Black Friday Promo', status: 'Scheduled', impressions: 0, clicks: 0 },
];

export default function AdminAdsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ads</CardTitle>
        <CardDescription>Manage your ads here.</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={dummyData} filterColumn="name" />
      </CardContent>
    </Card>
  );
}