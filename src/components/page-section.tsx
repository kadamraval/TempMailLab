"use client";

import React from 'react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
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
             const pageName = pageId === 'home' ? 'Tempmailoz' : pageId.replace('-page', '').replace('-', ' ');
             const pageTitle = pageId === 'home' ? 'Secure Your Digital Identity' : pageName.charAt(0).toUpperCase() + pageName.slice(1);
             const pageDescription = pageId === 'home' ? 'Generate instant, private, and secure temporary email addresses. Keep your real inbox safe from spam, trackers, and prying eyes.' : `Everything you need to know about our ${pageName}.`
             return { title: pageTitle, description: pageDescription, badge: { text: "New Feature", icon: "Sparkles", show: false } };
        case 'newsletter': return { title: "Stay Connected", description: "Subscribe for updates." };
        default: return null;
    }
}

// Sensible, complete default styles for any section
const getFallbackSectionStyles = (sectionId: string) => {
    const baseStyles: any = {
        marginTop: 0, 
        marginBottom: 0, 
        paddingTop: 64, 
        paddingBottom: 64, 
        paddingLeft: 16, 
        paddingRight: 16,
        borderTopWidth: 0, 
        borderBottomWidth: 0, 
        borderTopColor: 'hsl(var(--border))', 
        borderBottomColor: 'hsl(var(--border))',
        bgColor: 'transparent',
        useGradient: false, 
        gradientStart: 'hsl(var(--background))', 
        gradientEnd: 'hsl(var(--accent))'
    };

    if (sectionId === 'top-title') {
      baseStyles.useGradient = true;
      baseStyles.gradientStart = 'hsl(var(--gradient-start))';
      baseStyles.gradientEnd = 'hsl(var(--gradient-end))';
      baseStyles.bgColor = 'transparent';
    }
    
    return baseStyles;
};

// Deep merge utility
const isObject = (item: any) => {
  return (item && typeof item === 'object' && !Array.isArray(item));
};

const mergeDeep = (target: any, ...sources: any[]): any => {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (source[key] !== undefined && source[key] !== null) {
          if (isObject(source[key])) {
            if (!target[key]) Object.assign(target, { [key]: {} });
            mergeDeep(target[key], source[key]);
          } else {
            Object.assign(target, { [key]: source[key] });
          }
      }
    }
  }
  return mergeDeep(target, ...sources);
};

export const PageSection = ({ pageId, sectionId, order }: { pageId: string, sectionId: string, order: number }) => {
  const firestore = useFirestore();

  // --- DATA FETCHING ---
  const contentRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'pages', pageId, 'sections', sectionId);
  }, [firestore, pageId, sectionId]);

  const defaultStyleRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'sections', sectionId);
  }, [firestore, sectionId]);

  const styleOverrideRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'pages', pageId, 'sections', `${sectionId}_styles`);
  }, [firestore, pageId, sectionId]);

  const { data: content, isLoading: isLoadingContent, error: contentError } = useDoc(contentRef);
  const { data: defaultStyle, isLoading: isLoadingDefaultStyle, error: defaultStyleError } = useDoc(defaultStyleRef);
  const { data: styleOverride, isLoading: isLoadingStyleOverride } = useDoc(styleOverrideRef);
  
  const plansQuery = useMemoFirebase(() => {
    if (!firestore || !['pricing', 'pricing-comparison'].includes(sectionId)) return null;
    return query(collection(firestore, "plans"), where("status", "==", "active"));
  }, [firestore, sectionId]);
  
  const { data: plans } = useCollection<Plan>(plansQuery);

  // Self-seeding for content
  React.useEffect(() => {
    if (!isLoadingContent && !content && !contentError && contentRef) {
      const defaultContent = getDefaultContent(pageId, sectionId);
      if (defaultContent) {
        setDoc(contentRef, { ...defaultContent, order: order, id: sectionId }).catch(console.error);
      }
    }
  }, [isLoadingContent, content, contentError, contentRef, pageId, sectionId, order]);
  
  // SELF-SEEDING FOR STYLES
  React.useEffect(() => {
      if (!isLoadingDefaultStyle && !defaultStyle && !defaultStyleError && defaultStyleRef) {
          // If the global default style doc doesn't exist, create it with the fallback styles.
          setDoc(defaultStyleRef, getFallbackSectionStyles(sectionId)).catch(console.error);
      }
  }, [isLoadingDefaultStyle, defaultStyle, defaultStyleError, defaultStyleRef, sectionId]);


  const Component = sectionComponents[sectionId];
  if (!Component) return null;

  const isLoading = isLoadingContent || isLoadingDefaultStyle || isLoadingStyleOverride;
  
  if (isLoading) {
    if (sectionId === 'inbox' || sectionId === 'top-title') {
        return (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        );
    }
    return null;
  }

  const fallbackStyles = getFallbackSectionStyles(sectionId);
  const finalStyles = mergeDeep({}, fallbackStyles, defaultStyle, styleOverride);

  const wrapperStyle: React.CSSProperties = {
    backgroundColor: finalStyles.bgColor || 'transparent',
    backgroundImage: finalStyles.useGradient ? `linear-gradient(to bottom, ${finalStyles.gradientStart}, ${finalStyles.gradientEnd})` : 'none',
    marginTop: `${finalStyles.marginTop || 0}px`,
    marginBottom: `${finalStyles.marginBottom || 0}px`,
    borderTop: `${finalStyles.borderTopWidth || 0}px solid ${finalStyles.borderTopColor || 'transparent'}`,
    borderBottom: `${finalStyles.borderBottomWidth || 0}px solid ${finalStyles.borderBottomColor || 'transparent'}`,
    paddingTop: `${finalStyles.paddingTop || 0}px`,
    paddingBottom: `${finalStyles.paddingBottom || 0}px`,
  };

  const containerStyle: React.CSSProperties = {
      paddingLeft: `${finalStyles.paddingLeft || 0}px`,
      paddingRight: `${finalStyles.paddingRight || 0}px`,
  }
  
  const componentProps: any = {
    content: content || getDefaultContent(pageId, sectionId),
  };
  
  if (['pricing', 'pricing-comparison'].includes(sectionId)) {
    componentProps.plans = plans;
  }

  return (
    <div id={sectionId} style={wrapperStyle}>
       <div className="container mx-auto" style={containerStyle}>
          <Component {...componentProps} />
       </div>
    </div>
  );
};
