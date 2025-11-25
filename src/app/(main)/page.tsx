
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
import { collection, query, where, doc } from "firebase/firestore";
import type { Plan } from "@/app/(admin)/admin/packages/data";
import { useDoc } from "@/firebase";

const sectionsConfig = [
    { id: "why", component: UseCasesSection, hasCard: true },
    { id: "features", component: FeaturesSection, hasCard: false },
    { id: "exclusive-features", component: ExclusiveFeatures, hasCard: false },
    { id: "comparison", component: ComparisonSection, hasCard: true, props: { showTitle: true } },
    { id: "pricing", component: PricingSection, hasCard: false, props: { showTitle: true } },
    { id: "blog", component: BlogSection, hasCard: true, props: { showTitle: true } },
    { id: "testimonials", component: Testimonials, hasCard: false },
    { id: "faq", component: FaqSection, hasCard: true },
    { id: "newsletter", component: StayConnected, hasCard: false },
];

const SectionWrapper = ({ section, defaultStyles, pageId, plans }: { section: any, defaultStyles: any, pageId: string, plans: Plan[] }) => {
    const firestore = useFirestore();
    const overrideId = `${pageId}_${section.id}`;
    const styleOverrideRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'page_style_overrides', overrideId);
    }, [firestore, overrideId]);

    const { data: styleOverride, isLoading: isLoadingStyle } = useDoc(styleOverrideRef);
    
    if (isLoadingStyle) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }
    
    const finalStyles = { ...defaultStyles, ...styleOverride };

    const backgroundStyle = {
        backgroundColor: finalStyles.bgColor,
        backgroundImage: finalStyles.useGradient ? `linear-gradient(to bottom, ${finalStyles.gradientStart}, ${finalStyles.gradientEnd})` : 'none',
        marginTop: `${finalStyles.marginTop}px`,
        marginBottom: `${finalStyles.marginBottom}px`,
        paddingTop: `${finalStyles.paddingTop}px`,
        paddingBottom: `${finalStyles.paddingBottom}px`,
        borderTop: `${finalStyles.borderTopWidth}px solid ${finalStyles.borderTopColor}`,
        borderBottom: `${finalStyles.borderBottomWidth}px solid ${finalStyles.borderBottomColor}`,
    };

    const props = section.id === 'pricing' ? { ...section.props, plans } : section.props;

    return (
        <div id={section.id} className="z-10 relative" style={backgroundStyle}>
             <div style={{ paddingLeft: `${finalStyles.paddingLeft}px`, paddingRight: `${finalStyles.paddingRight}px`}}>
                <section.component removeBorder={!finalStyles.borderTopWidth && !finalStyles.borderBottomWidth} {...props} />
             </div>
        </div>
    )
}

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
      {sectionsConfig.map((section, index) => {
        const patternIndex = index % 4;
        let defaultStyles: any = {};
        let removeBorder = false;

        if (patternIndex === 0) { // Gradient 1
            defaultStyles = { background: 'linear-gradient(to bottom, hsl(var(--background)), hsla(var(--gradient-start), 0.1))' };
            removeBorder = true;
        } else if (patternIndex === 1) { // Solid
            defaultStyles = { backgroundColor: 'hsl(var(--background))' };
        } else if (patternIndex === 2) { // Gradient 2
            defaultStyles = { background: 'linear-gradient(to bottom, hsl(var(--background)), hsla(var(--gradient-end), 0.1))' };
            removeBorder = true;
        } else { // Solid
            defaultStyles = { backgroundColor: 'hsl(var(--background))' };
        }

        if (section.id === "newsletter") {
            defaultStyles = { backgroundColor: 'hsl(var(--background))', borderTop: '1px solid hsl(var(--border))'};
        }
        
        const finalDefaultStyles = {
            paddingTop: 64, paddingBottom: 64, paddingLeft: 16, paddingRight: 16,
            marginTop: 0, marginBottom: 0,
            borderTopWidth: section.id === "newsletter" ? 1 : 0, borderBottomWidth: 0,
            borderTopColor: 'hsl(var(--border))', borderBottomColor: 'hsl(var(--border))',
            ...defaultStyles
        };

        return (
            <SectionWrapper 
                key={section.id}
                section={section}
                defaultStyles={finalDefaultStyles}
                pageId="home"
                plans={plans || []}
            />
        )
      })}
    </>
  );
}

    