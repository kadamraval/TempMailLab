"use client";

import { useUser } from "@/firebase";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { isUserLoading } = useUser();

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div>
             <p>Dashboard content will go here. You can start by managing your temporary inboxes or checking your account settings.</p>
        </div>
        <div>
            <Button asChild>
                <Link href="/">Back to Home</Link>
            </Button>
        </div>
    </div>
  );
}
