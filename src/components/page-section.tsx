
"use client";

import React, { useEffect } from 'react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Plan } from "@/app/(admin)/admin/packages/data";

// Import all possible section components
import { DashboardClient } from '@/components/dashboard-client';
import { UseCasesSection } from '@/components/use-cases-section';
import { FeaturesSection } from '@/components/features-section';
import { ExclusiveFeatures } from '@/components/exclusive-features';
import { ComparisonSection } from '@/components/comparison-section';
import { PricingSection } from '@/components/pricing-section';
import { PricingComparisonTable } from '@/components/pricing-comparison-table';
import { BlogSection } from '@/components/blog-section';
import { Testimonials } from '@/components/testimonials';
import { FaqSection } from '@/components/faq-section';
import { StayConnected } from '@/components/stay-connected';
import ContactPage from '@/app/(main)/contact/page';
import { TopTitleSection } from './top-title-section';

// Default content data is now imported here for self-seeding
import { useCases, features, faqs, comparisonFeatures, testimonials, exclusiveFeatures, blogPosts } from '@/lib/content-data';

const sectionComponents: { [key: string]: React.ComponentType<any> } = {
  inbox: DashboardClient,
  why: UseCasesSection,
  features: FeaturesSection,
  'exclusive-features': ExclusiveFeatures,
  comparison: ComparisonSection,
  pricing: PricingSection,
  'pricing-comparison': PricingComparisonTable,
  blog: BlogSection,
  testimonials: Testimonials,
  faq: FaqSection,
  newsletter: StayConnected,
  'contact-form': ContactPage,
  'top-title': TopTitleSection,
};

const getDefaultContent = (pageId: string, sectionId: string) => {
    switch (sectionId) {
        case 'why': return { title: "Why Temp Mail?", description: "Protect your online identity with a disposable email address.", items: useCases };
        case 'features': return { title: "Features", description: "Discover the powerful features that make our service unique.", items: features };
        case 'exclusive-features': return { title: "Exclusive Features", description: "Unlock premium features for the ultimate temporary email experience.", items: exclusiveFeatures };
        case 'faq': return { title: "Questions?", description: "Find answers to frequently asked questions.", items: faqs };
        case 'comparison': return { title: "Tempmailoz Vs Others", description: "", items: comparisonFeatures };
        case 'testimonials': return { title: "What Our Users Say", description: "", items: testimonials };
        case 'blog': return { title: "From the Blog", description: "", items: blogPosts };
        case 'pricing': return { title: "Pricing", description: "Choose the plan that's right for you." };
        case 'pricing-comparison': return { title: "Full Feature Comparison", description: "" };
        case 'top-title': 
             const pageName = pageId.replace('-page', '').replace('-', ' ');
             return { title: pageName.charAt(0).toUpperCase() + pageName.slice(1), description: `Everything you need to know about our ${pageName}.` };
        case 'newsletter': return { title: "Stay Connected", description: "Subscribe for updates." };
        default: return null;
    }
}

const sectionDefaultStyles: { [key: string]: any } = {
    "inbox": { bgColor: 'rgba(0,0,0,0)', useGradient: true, gradientStart: 'hsla(var(--background))', gradientEnd: 'hsla(var(--gradient-start), 0.3)', paddingTop: 64, paddingBottom: 64 },
    "top-title": { bgColor: 'rgba(0,0,0,0)', useGradient: false, paddingTop: 64, paddingBottom: 32 },
    "why": { bgColor: 'rgba(0,0,0,0)', useGradient: true, gradientStart: 'hsl(var(--background))', gradientEnd: 'hsla(var(--gradient-start), 0.1)' },
    "features": { bgColor: 'hsl(var(--background))', useGradient: false },
    "exclusive-features": { bgColor: 'rgba(0,0,0,0)', useGradient: true, gradientStart: 'hsl(var(--background))', gradientEnd: 'hsla(var(--gradient-end), 0.1)' },
    "comparison": { bgColor: 'hsl(var(--background))', useGradient: false },
    "pricing": { bgColor: 'rgba(0,0,0,0)', useGradient: true, gradientStart: 'hsl(var(--background))', gradientEnd: 'hsla(var(--gradient-start), 0.1)' },
    "pricing-comparison": { bgColor: 'hsl(var(--background))', useGradient: false },
    "blog": { bgColor: 'rgba(0,0,0,0)', useGradient: true, gradientStart: 'hsl(var(--background))', gradientEnd: 'hsla(var(--gradient-end), 0.1)' },
    "testimonials": { bgColor: 'hsl(var(--background))', useGradient: false },
    "faq": { bgColor: 'rgba(0,0,0,0)', useGradient: true, gradientStart: 'hsl(var(--background))', gradientEnd: 'hsla(var(--gradient-start), 0.1)', paddingTop: 64, paddingBottom: 64 },
    "newsletter": { bgColor: 'hsl(var(--background))', useGradient: false, borderTopWidth: 1, paddingTop: 64, paddingBottom: 64 },
    "contact-form": { bgColor: 'hsl(var(--background))', useGradient: false, paddingTop: 80, paddingBottom: 80 },
};

export const PageSection = ({ pageId, sectionId, order }: { pageId: string, sectionId: string, order: number }) => {
  const firestore = useFirestore();

  // Reference for the section's content document
  const contentRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'pages', pageId, 'sections', sectionId);
  }, [firestore, pageId, sectionId]);
  
  // Reference for the section's style override document
  const styleRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'pages', pageId, 'sections', `${sectionId}_styles`);
  }, [firestore, pageId, sectionId]);

  const { data: content, isLoading: isLoadingContent, error: contentError } = useDoc(contentRef);
  const { data: styleOverride, isLoading: isLoadingStyle } = useDoc(styleRef);
  
  const plansQuery = useMemoFirebase(() => {
    if (!firestore || !['pricing', 'pricing-comparison'].includes(sectionId)) return null;
    return query(collection(firestore, "plans"), where("status", "==", "active"));
  }, [firestore, sectionId]);
  
  const { data: plans } = useCollection<Plan>(plansQuery);


  // Self-seeding logic
  useEffect(() => {
    if (!isLoadingContent && !content && !contentError && contentRef) {
      const defaultContent = getDefaultContent(pageId, sectionId);
      if (defaultContent) {
        setDoc(contentRef, { ...defaultContent, order: order, id: sectionId }).catch(console.error);
      }
    }
  }, [isLoadingContent, content, contentError, contentRef, pageId, sectionId, order]);

  const Component = sectionComponents[sectionId];
  if (!Component) return null;

  if (isLoadingContent || isLoadingStyle) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const defaultStyles = sectionDefaultStyles[sectionId] || {};
  const finalStyles = { ...defaultStyles, ...styleOverride };

  const styleProps = {
    backgroundColor: finalStyles.bgColor,
    backgroundImage: finalStyles.useGradient ? `linear-gradient(to bottom, ${finalStyles.gradientStart}, ${finalStyles.gradientEnd})` : 'none',
    marginTop: `${finalStyles.marginTop}px`,
    marginBottom: `${finalStyles.marginBottom}px`,
    paddingTop: `${finalStyles.paddingTop}px`,
    paddingBottom: `${finalStyles.paddingBottom}px`,
    borderTop: `${finalStyles.borderTopWidth}px solid ${finalStyles.borderTopColor}`,
    borderBottom: `${finalStyles.borderBottomWidth}px solid ${finalStyles.borderBottomColor}`,
  };
  
  const componentProps = {
    content: content || getDefaultContent(pageId, sectionId), // Pass content to component
    plans,
    removeBorder: !finalStyles.borderTopWidth && !finalStyles.borderBottomWidth,
  };

  return (
    <div id={sectionId} className="z-10 relative" style={styleProps}>
      <div style={{ paddingLeft: `${finalStyles.paddingLeft}px`, paddingRight: `${finalStyles.paddingRight}px`}}>
        <Component {...componentProps} />
      </div>
    </div>
  );
};
