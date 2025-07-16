
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/admin/data-table";
import { columns } from "@/components/admin/columns";

// Dummy data for demonstration
const dummyData = [
    { id: 'SUMMER_SALE_24', name: 'Summer Sale Banner', status: 'Active', clicks: 1204, impressions: 56023 },
    { id: 'PREMIUM_UPGRADE_POPUP', name: 'Premium Upgrade Popup', status: 'Active', clicks: 832, impressions: 15344 },
    { id: 'FOOTER_AD_SLOT', name: 'Footer Ad Slot', status: 'Paused', clicks: 2400, impressions: 150234 },
];

export default function AdminAdsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ads Management</CardTitle>
        <CardDescription>Create, manage, and monitor your ad campaigns.</CardDescription>
      </CardHeader>
       <CardContent>
        <DataTable columns={columns} data={dummyData} filterColumn="name" />
      </CardContent>
    </Card>
  );
}
