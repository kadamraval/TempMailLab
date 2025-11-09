
"use client";

import { DashboardClient } from "@/components/dashboard-client";
import { useUser } from "@/firebase";
import { Loader2 } from "lucide-react";
import { Hero } from "@/components/hero";
import { useEffect } from "react";
import { signInAnonymously } from "firebase/auth";
import { useAuth } from "@/firebase";

export default function HomePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  useEffect(() => {
    // If the user status is determined and there's no user, sign them in anonymously.
    if (!isUserLoading && !user) {
      signInAnonymously(auth).catch((error) => {
        console.error("Anonymous sign-in failed:", error);
      });
    }
  }, [user, isUserLoading, auth]);


  if (isUserLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show the dashboard for both anonymous and registered users
  return (
    <main className="container mx-auto px-4 py-8">
      <DashboardClient />
    </main>
  );
}
