
"use client";

import { useUser, useAuth } from "@/firebase";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { signInAnonymously } from "firebase/auth";
import { FeaturesSection } from "@/components/features-section";
import { PricingSection } from "@/components/pricing-section";
import { Testimonials } from "@/components/testimonials";
import { FaqSection } from "@/components/faq-section";
import { DashboardClient } from "@/components/dashboard-client";
import { StayConnected } from "@/components/stay-connected";

export default function HomePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  useEffect(() => {
    if (!isUserLoading && !user && auth) {
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
  
  return (
    <>
      <div id="inbox" className="py-24 sm:py-32">
        <main className="container mx-auto px-4">
          <div className="relative w-full max-w-2xl mx-auto text-center">
            <div className="absolute -top-12 -left-1/2 w-[200%] h-48 bg-primary/10 rounded-full blur-3xl -z-10" />
            <h2 className="text-3xl font-bold tracking-tight">Your Temporary Inbox</h2>
          </div>
          {user ? <div className="mt-8"><DashboardClient /></div> : <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}
        </main>
      </div>
      <FeaturesSection />
      <PricingSection />
      <Testimonials />
      <FaqSection />
      <StayConnected />
    </>
  );
}
