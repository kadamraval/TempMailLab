
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSupportPage() {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Support Tickets</CardTitle>
          <CardDescription>View and respond to user support requests.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Support ticket management interface will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
