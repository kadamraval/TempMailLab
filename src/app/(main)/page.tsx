
"use client";

import { useUser, useAuth } from "@/firebase";
import { Loader2, ShieldCheck } from "lucide-react";
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
      <div id="inbox" className="py-16 sm:py-20">
        <main className="container mx-auto px-4">
          <div className="relative w-full max-w-4xl mx-auto text-center mb-12">
            <div className="absolute -top-12 -left-1/2 w-[200%] h-48 bg-primary/10 rounded-full blur-3xl -z-10" />
            <div className="inline-flex items-center justify-center gap-2 bg-primary/10 text-primary font-semibold px-4 py-2 rounded-full text-sm mb-4">
              <ShieldCheck className="h-4 w-4" />
              100% Secure & Free
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter leading-tight">
              Temporary Email Address
            </h1>
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
