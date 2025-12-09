
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PremiumBanner } from "@/components/premium-banner";

export default function UserBillingPage() {
  return (
    <div className="space-y-6">
      <PremiumBanner />
       <Card>
        <CardHeader>
          <CardTitle>Billing & Invoices</CardTitle>
          <CardDescription>View and manage all billing activities and invoices.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Billing and invoice management interface will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
