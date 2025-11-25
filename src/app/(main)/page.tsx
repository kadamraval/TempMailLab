
"use client";

import { useUser } from "@/firebase/auth/use-user";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
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
        where("status", "==", "active")
    );
  }, [firestore]);

  const { data: plans, isLoading: isLoadingPlans } = useCollection<Plan>(plansQuery);
  
  const sections = [
    { id: "why", component: UseCasesSection, hasCard: true },
    { id: "features", component: FeaturesSection, hasCard: false },
    { id: "exclusive-features", component: ExclusiveFeatures, hasCard: false },
    { id: "comparison", component: ComparisonSection, hasCard: true, props: { showTitle: true } },
    { id: "pricing", component: PricingSection, hasCard: false, props: { plans: plans || [], showTitle: true } },
    { id: "blog", component: BlogSection, hasCard: true, props: { showTitle: true } },
    { id: "testimonials", component: Testimonials, hasCard: false },
    { id: "faq", component: FaqSection, hasCard: true },
    { id: "newsletter", component: StayConnected, hasCard: false },
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
      <div id="inbox" className="z-10 relative py-16 sm:py-20" style={{ background: 'linear-gradient(to bottom, hsl(var(--background)), hsla(var(--gradient-start), 0.3))' }}>
        <div className="container mx-auto px-4">
          <div className="relative w-full max-w-4xl mx-auto text-center mb-12">
            <div className="absolute -top-12 -left-1/2 w-[200%] h-48 bg-primary/10 rounded-full blur-3xl -z-10" />
            <span className="inline-block bg-primary/10 text-primary font-semibold px-4 py-1 rounded-full text-sm mb-4">
                100% Free & Secure
            </span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter leading-tight bg-gradient-to-b from-primary to-accent text-transparent bg-clip-text">
              Temporary Email Address
            </h1>
          </div>
          <div className="mt-8">
            <DashboardClient />
          </div>
        </div>
      </div>
      {sections.map((Section, index) => {
        const patternIndex = index % 4;
        let backgroundStyle = {};
        let removeBorder = false;

        if (patternIndex === 0) { // Gradient 1
            backgroundStyle = { background: 'linear-gradient(to bottom, hsl(var(--background)), hsla(var(--gradient-start), 0.1))' };
            removeBorder = true;
        } else if (patternIndex === 1) { // Solid
            backgroundStyle = { backgroundColor: 'hsl(var(--background))' };
        } else if (patternIndex === 2) { // Gradient 2
            backgroundStyle = { background: 'linear-gradient(to bottom, hsl(var(--background)), hsla(var(--gradient-end), 0.1))' };
            removeBorder = true;
        } else { // Solid
            backgroundStyle = { backgroundColor: 'hsl(var(--background))' };
        }

        if (Section.id === "newsletter") {
            backgroundStyle = { backgroundColor: 'hsl(var(--background))', borderTop: '1px solid hsl(var(--border))'};
        }

        return (
            <div key={index} id={Section.id} className="z-10 relative py-16 sm:py-20" style={backgroundStyle}>
                <Section.component removeBorder={removeBorder && Section.hasCard} {...Section.props} />
            </div>
        )
      })}
    </>
  );
}

    