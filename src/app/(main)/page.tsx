
"use client";

import { useUser, useAuth } from "@/firebase";
import { Loader2 } from "lucide-react";
import { Hero } from "@/components/hero";
import { useEffect } from "react";
import { signInAnonymously } from "firebase/auth";
import { FeaturesSection } from "@/components/features-section";
import { PricingSection } from "@/components/pricing-section";
import { FaqSection } from "@/components/faq-section";
import { DashboardClient } from "@/components/dashboard-client";

export default function HomePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  useEffect(() => {
    if (!isUserLoading && !user) {
      signInAnonymously(auth).catch((error) => {
        console.error("Anonymous sign-in failed:", error);
      });
    }
  }, [user, isUserLoading, auth]);


  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (!user) {
    // This case should be rare due to anonymous sign-in, but as a fallback:
    return (
       <>
        <Hero />
        <FeaturesSection />
        <PricingSection />
        <FaqSection />
      </>
    )
  }

  // Show the dashboard for both anonymous and registered users
  return (
    <>
    <main className="container mx-auto px-4 py-8">
      <DashboardClient />
    </main>
    <FeaturesSection />
    <PricingSection />
    <FaqSection />
    </>
  );
}
