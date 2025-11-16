
"use client";

import { useUser } from "@/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Welcome, {user?.displayName || 'User'}!</CardTitle>
                <CardDescription>This is your personal dashboard. Here you can manage your inboxes, settings, and subscription.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Dashboard content will go here. You can start by managing your temporary inboxes or checking your account settings.</p>
            </CardContent>
            <CardContent>
                 <Button asChild>
                    <Link href="/">Back to Inbox Generator</Link>
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
