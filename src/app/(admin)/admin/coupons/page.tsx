
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminCouponsPage() {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Manage Coupons</CardTitle>
          <CardDescription>Create and manage discount coupons for subscription plans.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Coupon management interface will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
