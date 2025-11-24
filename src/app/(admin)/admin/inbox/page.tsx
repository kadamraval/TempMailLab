
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminInboxPage() {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Global Inbox</CardTitle>
          <CardDescription>Monitor and manage emails across the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Global inbox and email monitoring interface will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
