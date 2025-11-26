
"use client";

import React from 'react';
import { Loader2 } from 'lucide-react';
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
import { TopTitleSection } from '@/components/top-title-section';
import * as contentData from '@/lib/content-data';

const sectionComponents: { [key: string]: React.ComponentType<any> } = {
  inbox: DashboardClient, why: UseCasesSection, features: FeaturesSection,
  'exclusive-features': ExclusiveFeatures, comparison: ComparisonSection, pricing: PricingSection,
  'pricing-comparison': PricingComparisonTable, blog: BlogSection, testimonials: Testimonials,
  faq: FaqSection, newsletter: StayConnected, 'contact-form': ContactPage, 'top-title': TopTitleSection,
};

const getDefaultContent = (sectionId: string) => {
    switch (sectionId) {
        case 'why': return { title: "Why Temp Mail?", description: "Protect your online identity...", items: contentData.useCases };
        case 'features': return { title: "Features", description: "Discover powerful features...", items: contentData.features };
        case 'exclusive-features': return { title: "Exclusive Features", description: "Unlock premium features...", items: contentData.exclusiveFeatures };
        case 'faq': return { title: "Questions?", description: "Find answers...", items: contentData.faqs };
        case 'comparison': return { title: "Tempmailoz Vs Others", description: "", items: contentData.comparisonFeatures };
        case 'testimonials': return { title: "What Our Users Say", description: "", items: contentData.testimonials };
        case 'blog': return { title: "From the Blog", description: "", items: contentData.blogPosts };
        case 'pricing': return { title: "Pricing", description: "Choose the plan that's right for you." };
        case 'pricing-comparison': return { title: "Full Feature Comparison", description: "" };
        case 'top-title': return { title: 'Secure Your Digital Identity', description: 'Generate instant, private, and secure temporary email addresses.' };
        case 'newsletter': return { title: "Stay Connected", description: "Subscribe for updates." };
        case 'inbox': return {};
        default: return null;
    }
};

interface AdminSectionPreviewProps {
    sectionId: string;
    styles: React.CSSProperties;
}

export const AdminSectionPreview = ({ sectionId, styles }: AdminSectionPreviewProps) => {
    const Component = sectionComponents[sectionId];
    if (!Component) {
        return <p>Section preview not available.</p>;
    }

    const defaultContent = getDefaultContent(sectionId);

    const previewStyle: React.CSSProperties = {
        backgroundColor: styles.bgColor || 'transparent',
        backgroundImage: styles.useGradient ? `linear-gradient(to bottom, ${styles.gradientStart}, ${styles.gradientEnd})` : 'none',
        marginTop: `${styles.marginTop || 0}px`,
        marginBottom: `${styles.marginBottom || 0}px`,
        borderTop: `${styles.borderTopWidth || 0}px solid ${styles.borderTopColor || 'transparent'}`,
        borderBottom: `${styles.borderBottomWidth || 0}px solid ${styles.borderBottomColor || 'transparent'}`,
    };

    const previewContainerStyle: React.CSSProperties = {
        paddingTop: `${styles.paddingTop || 0}px`,
        paddingBottom: `${styles.paddingBottom || 0}px`,
        paddingLeft: `${styles.paddingLeft || 0}px`,
        paddingRight: `${styles.paddingRight || 0}px`,
    };

    return (
        <div style={previewStyle}>
            <div className="container mx-auto" style={previewContainerStyle}>
                <Component content={defaultContent} />
            </div>
        </div>
    );
};
