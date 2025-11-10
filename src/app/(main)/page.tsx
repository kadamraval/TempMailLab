
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
import { UseCasesSection } from "@/components/use-cases-section";
import { ComparisonSection } from "@/components/comparison-section";
import { ExclusiveFeatures } from "@/components/exclusive-features";
import { BlogSection } from "@/components/blog-section";
import { cn } from "@/lib/utils";

const sections = [
  { component: UseCasesSection },
  { component: FeaturesSection },
  { component: ExclusiveFeatures },
  { component: ComparisonSection },
  { component: PricingSection },
  { component: BlogSection },
  { component: Testimonials },
  { component: FaqSection },
  { component: StayConnected },
];

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
            <span className="inline-block bg-primary/10 text-primary font-semibold px-4 py-1 rounded-full text-sm mb-4">
                100% Free & Secure
            </span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter leading-tight">
              Temporary Email Address
            </h1>
          </div>
          {user ? <div className="mt-8"><DashboardClient /></div> : <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}
        </main>
      </div>
      {sections.map((Section, index) => {
        let backgroundClass = "";
        if (index % 2 === 0) { // Odd sections
            backgroundClass = "bg-gradient-to-b from-white to-[#A3DC9A]/30 dark:from-background dark:to-[#A3DC9A]/10";
        } else { // Even sections
             backgroundClass = "bg-gradient-to-b from-white to-[#DEE791]/30 dark:from-background dark:to-[#DEE791]/10";
        }
        return (
            <div key={index} className={cn(backgroundClass)}>
                <Section.component />
            </div>
        )
      })}
    </>
  );
}
