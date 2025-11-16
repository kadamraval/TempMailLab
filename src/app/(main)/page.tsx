
"use client";

import { useUser, useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Loader2 } from "lucide-react";
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
import { collection, query, where } from "firebase/firestore";
import type { Plan } from "@/app/(admin)/admin/packages/data";


export default function HomePage() {
  const { isUserLoading } = useUser();
  const firestore = useFirestore();

  const plansQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
        collection(firestore, "plans"),
        where("status", "==", "active"),
        where("name", "!=", "Default")
    );
  }, [firestore]);

  const { data: plans, isLoading: isLoadingPlans } = useCollection<Plan>(plansQuery);
  
  const sections = [
    { component: UseCasesSection, hasCard: true },
    { component: FeaturesSection, hasCard: false },
    { component: ExclusiveFeatures, hasCard: false },
    { component: ComparisonSection, hasCard: true },
    { component: PricingSection, hasCard: false, props: { plans: plans || [] } },
    { component: BlogSection, hasCard: true },
    { component: Testimonials, hasCard: false },
    { component: FaqSection, hasCard: true },
    { component: StayConnected, hasCard: false },
  ];


  if (isUserLoading || isLoadingPlans) {
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
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter leading-tight bg-gradient-to-b from-primary to-accent text-transparent bg-clip-text">
              Temporary Email Address
            </h1>
          </div>
          <div className="mt-8"><DashboardClient /></div>
        </main>
      </div>
      {sections.map((Section, index) => {
        const patternIndex = index % 4;
        let backgroundClass = "";
        let removeBorder = false;

        if (patternIndex === 0) { // 1st Gradient
            backgroundClass = "bg-gradient-to-b from-white to-[hsl(var(--gradient-start))]/30 dark:from-background dark:to-[hsl(var(--gradient-start))]/10";
            removeBorder = true;
        } else if (patternIndex === 1) { // White
            backgroundClass = "bg-white dark:bg-background";
        } else if (patternIndex === 2) { // 2nd Gradient
            backgroundClass = "bg-gradient-to-b from-white to-[hsl(var(--gradient-end))]/30 dark:from-background dark:to-[hsl(var(--gradient-end))]/10";
            removeBorder = true;
        } else { // White
            backgroundClass = "bg-white dark:bg-background";
        }

        return (
            <div key={index} className={cn(backgroundClass)}>
                <Section.component removeBorder={removeBorder && Section.hasCard} {...Section.props} />
            </div>
        )
      })}
    </>
  );
}
