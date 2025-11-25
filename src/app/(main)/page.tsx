
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
import { collection, query, where, doc } from "firebase/firestore";
import type { Plan } from "@/app/(admin)/admin/packages/data";
import { useDoc } from "@/firebase";

const pageId = "home";

const sectionsConfig = [
    { id: "why", component: UseCasesSection, props: { showTitle: true } },
    { id: "features", component: FeaturesSection, props: { showTitle: true } },
    { id: "exclusive-features", component: ExclusiveFeatures, props: { showTitle: true } },
    { id: "comparison", component: ComparisonSection, props: { showTitle: true } },
    { id: "pricing", component: PricingSection, props: { showTitle: true } },
    { id: "blog", component: BlogSection, props: { showTitle: true } },
    { id: "testimonials", component: Testimonials, props: { showTitle: true } },
    { id: "faq", component: FaqSection, props: { showTitle: true } },
    { id: "newsletter", component: StayConnected, props: { showTitle: true } },
];

const defaultStylesBase = {
    marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
    paddingTop: 64, paddingBottom: 64, paddingLeft: 16, paddingRight: 16,
    borderTopWidth: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderRightWidth: 0,
    borderTopColor: 'hsl(var(--border))', borderBottomColor: 'hsl(var(--border))',
    borderLeftColor: 'hsl(var(--border))', borderRightColor: 'hsl(var(--border))'
};

const sectionDefaultStyles: { [key: string]: any } = {
    "inbox": { ...defaultStylesBase, bgColor: 'rgba(0,0,0,0)', useGradient: true, gradientStart: 'hsla(var(--background))', gradientEnd: 'hsla(var(--gradient-start), 0.3)', paddingTop: 64, paddingBottom: 64 },
    "why": { ...defaultStylesBase, bgColor: 'rgba(0,0,0,0)', useGradient: true, gradientStart: 'hsl(var(--background))', gradientEnd: 'hsla(var(--gradient-start), 0.1)' },
    "features": { ...defaultStylesBase, bgColor: 'hsl(var(--background))', useGradient: false },
    "exclusive-features": { ...defaultStylesBase, bgColor: 'rgba(0,0,0,0)', useGradient: true, gradientStart: 'hsl(var(--background))', gradientEnd: 'hsla(var(--gradient-end), 0.1)' },
    "comparison": { ...defaultStylesBase, bgColor: 'hsl(var(--background))', useGradient: false },
    "pricing": { ...defaultStylesBase, bgColor: 'rgba(0,0,0,0)', useGradient: true, gradientStart: 'hsl(var(--background))', gradientEnd: 'hsla(var(--gradient-start), 0.1)' },
    "blog": { ...defaultStylesBase, bgColor: 'rgba(0,0,0,0)', useGradient: true, gradientStart: 'hsl(var(--background))', gradientEnd: 'hsla(var(--gradient-end), 0.1)' },
    "testimonials": { ...defaultStylesBase, bgColor: 'hsl(var(--background))', useGradient: false },
    "faq": { ...defaultStylesBase, bgColor: 'rgba(0,0,0,0)', useGradient: true, gradientStart: 'hsl(var(--background))', gradientEnd: 'hsla(var(--gradient-start), 0.1)', paddingTop: 64, paddingBottom: 64 },
    "newsletter": { ...defaultStylesBase, bgColor: 'hsl(var(--background))', useGradient: false, borderTopWidth: 1, paddingTop: 64, paddingBottom: 64 },
};


const SectionWrapper = ({ sectionId, pageId, plans, children, component: Component, props: componentProps }: { sectionId: string, pageId: string, plans: Plan[], children?: React.ReactNode, component?: React.ComponentType<any>, props?: any }) => {
    const firestore = useFirestore();
    const defaultStyles = sectionDefaultStyles[sectionId] || defaultStylesBase;
    
    const overrideId = `${pageId}_${sectionId}`;
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

    const propsWithPlans = sectionId === 'pricing' ? { ...componentProps, plans } : componentProps;

    return (
        <div id={sectionId} className="z-10 relative" style={backgroundStyle}>
             <div style={{ paddingLeft: `${finalStyles.paddingLeft}px`, paddingRight: `${finalStyles.paddingRight}px`}}>
                {children || (Component ? <Component {...propsWithPlans} pageId={pageId} sectionId={sectionId} removeBorder={!finalStyles.borderTopWidth && !finalStyles.borderBottomWidth} /> : null)}
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
      <SectionWrapper sectionId="inbox" pageId={pageId} plans={plans || []}>
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
      </SectionWrapper>

      {sectionsConfig.map((section) => (
        <SectionWrapper 
            key={section.id}
            sectionId={section.id}
            pageId={pageId}
            plans={plans || []}
            component={section.component}
            props={section.props}
        />
      ))}
    </>
  );
}

    