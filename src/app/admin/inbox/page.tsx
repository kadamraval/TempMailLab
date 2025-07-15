import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/admin/data-table";
import { columns } from "@/components/admin/columns";

// Dummy data for demonstration
const dummyData = [
    { id: 'msg-001', name: 'Welcome to TempInbox!', from: 'support@tempinbox.com', status: 'Unread', received: '5 minutes ago' },
    { id: 'msg-002', name: 'Your verification code', from: 'auth@service.com', status: 'Read', received: '2 hours ago' },
    { id: 'msg-003', name: 'Weekly Newsletter', from: 'newsletter@example.com', status: 'Read', received: '1 day ago' },
];

export default function AdminInboxPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inbox</CardTitle>
        <CardDescription>Manage your inbox here.</CardDescription>
      </CardHeader>
       <CardContent>
        <DataTable columns={columns} data={dummyData} filterColumn="name" />
      </CardContent>
    </Card>
  );
}