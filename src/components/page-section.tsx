"use client";

import React, { useMemo } from 'react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Plan } from "@/app/(admin)/admin/packages/data";
import DOMPurify from 'isomorphic-dompurify';

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

// Default content data is now imported here for fallback
import { useCases, features, faqs, comparisonFeatures, testimonials, exclusiveFeatures, blogPosts } from '@/lib/content-data';

// Generic content component with WYSIWYG support
const ContentSection = ({ content }: { content: { title: string, html: string } }) => {
  if (!content) return null;
  const cleanHtml = DOMPurify.sanitize(content.html);
  return (
    <section>
        <div className="text-center space-y-4 mb-12">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">{content.title}</h2>
        </div>
        <div 
            className="prose dark:prose-invert max-w-4xl mx-auto"
            dangerouslySetInnerHTML={{ __html: cleanHtml }}
        />
    </section>
  )
};

const sectionComponents: { [key: string]: React.ComponentType<any> } = {
  inbox: DashboardClient, why: UseCasesSection, features: FeaturesSection,
  'exclusive-features': ExclusiveFeatures, comparison: ComparisonSection, pricing: PricingSection,
  'pricing-comparison': PricingComparisonTable, blog: BlogSection, testimonials: Testimonials,
  faq: FaqSection, newsletter: StayConnected, 'contact-form': ContactPage, 'top-title': TopTitleSection,
  content: ContentSection,
};

const getDefaultContent = (pageId: string, sectionId: string) => {
    const pageName = pageId.replace('-page', '').replace(/-/g, ' ');
    const titleCasedPageName = pageName.charAt(0).toUpperCase() + pageName.slice(1);
    
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
             const pageTitle = pageId === 'home' ? 'Secure Your Digital Identity' : titleCasedPageName;
             const pageDescription = pageId === 'home' 
                ? 'Generate instant, private, and secure temporary email addresses. Keep your real inbox safe from spam, trackers, and prying eyes.' 
                : `Everything you need to know about our ${pageName}.`;
             return { title: pageTitle, description: pageDescription, badge: { text: "New Feature", icon: "Sparkles", show: false } };
        case 'newsletter': return { title: "Stay Connected", description: "Subscribe for updates." };
        case 'inbox': return { name: "Inbox" }; 
        case 'content': return { title: titleCasedPageName, html: `<p>This is the default content for the ${titleCasedPageName} page. You can edit this in the admin panel.</p>` };
        default: return null;
    }
}

const getFallbackSectionStyles = (sectionId: string) => {
    const baseStyles: any = {
        marginTop: 0, marginBottom: 0, paddingTop: 64, paddingBottom: 64, paddingLeft: 16, paddingRight: 16,
        borderTopWidth: 0, borderBottomWidth: 0, borderTopColor: 'hsl(var(--border))', borderBottomColor: 'hsl(var(--border))',
        bgColor: 'transparent', useGradient: false, gradientStart: 'hsl(var(--gradient-start))', gradientEnd: 'hsl(var(--gradient-end))'
    };
    if (sectionId === 'top-title') { baseStyles.useGradient = true; baseStyles.paddingTop = 80; baseStyles.paddingBottom = 80; }
    return baseStyles;
};

const isObject = (item: any): item is object => item && typeof item === 'object' && !Array.isArray(item);

const mergeDeep = (target: any, ...sources: any[]): any => {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (source[key] !== undefined) {
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

export const PageSection = ({ pageId, sectionId, order, isHidden }: { pageId: string, sectionId: string, order: number, isHidden?: boolean }) => {
  const firestore = useFirestore();

  const contentRef = useMemoFirebase(() => doc(firestore, 'pages', pageId, 'sections', sectionId), [firestore, pageId, sectionId]);
  const defaultStyleRef = useMemoFirebase(() => doc(firestore, 'sections', sectionId), [firestore, sectionId]);
  const styleOverrideRef = useMemoFirebase(() => doc(firestore, 'pages', pageId, 'sections', `${sectionId}_styles`), [firestore, pageId, sectionId]);

  const { data: content, isLoading: isLoadingContent } = useDoc(contentRef);
  const { data: defaultStyle, isLoading: isLoadingDefaultStyle } = useDoc(defaultStyleRef);
  const { data: styleOverride, isLoading: isLoadingStyleOverride } = useDoc(styleOverrideRef);
  
  const plansQuery = useMemoFirebase(() => !['pricing', 'pricing-comparison'].includes(sectionId) ? null : query(collection(firestore, "plans"), where("status", "==", "active")), [firestore, sectionId]);
  const { data: plans } = useCollection<Plan>(plansQuery);
  
  const finalStyles = useMemo(() => {
    const fallback = getFallbackSectionStyles(sectionId);
    return mergeDeep({}, fallback, defaultStyle, styleOverride);
  }, [defaultStyle, styleOverride, sectionId]);

  const isLoading = isLoadingContent || isLoadingDefaultStyle || isLoadingStyleOverride;

  if (content?.hidden || isHidden) return null;

  const Component = sectionComponents[sectionId];
  if (!Component) return null;

  if (isLoading) {
      if (sectionId === 'inbox') return null;
      return <div className="flex items-center justify-center min-h-[200px]"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  const finalContent = content || getDefaultContent(pageId, sectionId);
  if (!finalContent) return null;
  
  const wrapperStyle: React.CSSProperties = {
    backgroundColor: finalStyles.bgColor || 'transparent',
    backgroundImage: finalStyles.useGradient ? `linear-gradient(to bottom, ${finalStyles.gradientStart}, ${finalStyles.gradientEnd})` : 'none',
    marginTop: `${finalStyles.marginTop || 0}px`, marginBottom: `${finalStyles.marginBottom || 0}px`,
    borderTop: `${finalStyles.borderTopWidth || 0}px solid ${finalStyles.borderTopColor || 'transparent'}`,
    borderBottom: `${finalStyles.borderBottomWidth || 0}px solid ${finalStyles.borderBottomColor || 'transparent'}`,
  };
  const containerStyle: React.CSSProperties = { paddingTop: `${finalStyles.paddingTop || 0}px`, paddingBottom: `${finalStyles.paddingBottom || 0}px` };
  
  const componentProps: any = { content: finalContent };
  if (['pricing', 'pricing-comparison'].includes(sectionId)) componentProps.plans = plans;

  return (
    <div id={sectionId} style={wrapperStyle}>
       <div className="container mx-auto" style={containerStyle}>
          <Component {...componentProps} />
       </div>
    </div>
  );
};
