"use client";

import { Card, CardContent } from "@/components/ui/card";

export default function UserDashboardContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        {children}
      </CardContent>
    </Card>
  );
}
