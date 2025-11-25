
"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import Link from 'next/link';

// Import all section components for preview
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
import { DashboardClient } from '@/components/dashboard-client';

const KnowledgebasePlaceholder = () => (
    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
        <p className="text-lg font-semibold">Knowledgebase Section</p>
        <p>Content for this section will be managed here in the future.</p>
    </div>
);

const TopTitlePlaceholder = () => (
     <div className="relative w-full max-w-4xl mx-auto text-center py-16">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter leading-tight bg-gradient-to-b from-primary to-accent text-transparent bg-clip-text">
            Page Title
        </h1>
        <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">This is a placeholder for the page subtitle or description.</p>
    </div>
)

const sectionComponents: { [key: string]: React.ComponentType<any> } = {
    "inbox": DashboardClient,
    "top-title": TopTitlePlaceholder,
    "why": UseCasesSection,
    "features": FeaturesSection,
    "exclusive-features": ExclusiveFeatures,
    "comparison": ComparisonSection,
    "pricing": PricingSection,
    "pricing-comparison": PricingComparisonTable,
    "blog": BlogSection,
    "testimonials": Testimonials,
    "faq": FaqSection,
    "newsletter": StayConnected,
    "contact-form": ContactPage,
    "knowledgebase": KnowledgebasePlaceholder,
};

const sectionDetails: { [key: string]: { name: string, defaultStyles: any } } = {
    "inbox": { name: "Inbox", defaultStyles: { bgColor: '#FFFFFF', gradientColor: '#F5F5F5', marginTop: 64, marginBottom: 64, marginLeft: 0, marginRight: 0, paddingTop: 64, paddingBottom: 64, paddingLeft: 16, paddingRight: 16 } },
    "top-title": { name: "Top Title", defaultStyles: { bgColor: '#FFFFFF', gradientColor: '#F5F5F5', marginTop: 64, marginBottom: 64, marginLeft: 0, marginRight: 0, paddingTop: 0, paddingBottom: 0, paddingLeft: 16, paddingRight: 16 } },
    "why": { name: "Why", defaultStyles: { bgColor: '#FFFFFF', gradientColor: '#F5F5F5', marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0, paddingTop: 64, paddingBottom: 64, paddingLeft: 16, paddingRight: 16 } },
    "features": { name: "Features", defaultStyles: { bgColor: '#F5F5F5', gradientColor: '#FFFFFF', marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0, paddingTop: 64, paddingBottom: 64, paddingLeft: 16, paddingRight: 16 } },
    "exclusive-features": { name: "Exclusive Features", defaultStyles: { bgColor: '#FFFFFF', gradientColor: '#F5F5F5', marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0, paddingTop: 64, paddingBottom: 64, paddingLeft: 16, paddingRight: 16 } },
    "comparison": { name: "Comparison", defaultStyles: { bgColor: '#F5F5F5', gradientColor: '#FFFFFF', marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0, paddingTop: 64, paddingBottom: 64, paddingLeft: 16, paddingRight: 16 } },
    "pricing": { name: "Pricing", defaultStyles: { bgColor: '#FFFFFF', gradientColor: '#F5F5F5', marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0, paddingTop: 64, paddingBottom: 64, paddingLeft: 16, paddingRight: 16 } },
    "pricing-comparison": { name: "Price Comparison", defaultStyles: { bgColor: '#F5F5F5', gradientColor: '#FFFFFF', marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0, paddingTop: 64, paddingBottom: 64, paddingLeft: 16, paddingRight: 16 } },
    "blog": { name: "Blog", defaultStyles: { bgColor: '#FFFFFF', gradientColor: '#F5F5F5', marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0, paddingTop: 64, paddingBottom: 64, paddingLeft: 16, paddingRight: 16 } },
    "testimonials": { name: "Testimonials", defaultStyles: { bgColor: '#F5F5F5', gradientColor: '#FFFFFF', marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0, paddingTop: 64, paddingBottom: 64, paddingLeft: 16, paddingRight: 16 } },
    "faq": { name: "FAQ", defaultStyles: { bgColor: '#FFFFFF', gradientColor: '#F5F5F5', marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0, paddingTop: 64, paddingBottom: 64, paddingLeft: 16, paddingRight: 16 } },
    "newsletter": { name: "Newsletter", defaultStyles: { bgColor: '#F5F5F5', gradientColor: '#FFFFFF', marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0, paddingTop: 64, paddingBottom: 64, paddingLeft: 16, paddingRight: 16 } },
    "contact-form": { name: "Contact", defaultStyles: { bgColor: '#FFFFFF', gradientColor: '#F5F5F5', marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0, paddingTop: 64, paddingBottom: 64, paddingLeft: 16, paddingRight: 16 } },
    "knowledgebase": { name: "Knowledgebase", defaultStyles: { bgColor: '#FFFFFF', gradientColor: '#F5F5F5', marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0, paddingTop: 64, paddingBottom: 64, paddingLeft: 16, paddingRight: 16 } },
};

export default function EditSectionPage() {
    const params = useParams();
    const sectionId = params.id as string;
    
    const [styles, setStyles] = useState(sectionDetails[sectionId]?.defaultStyles || {});

    useEffect(() => {
        // When the sectionId changes, reset the styles to the default for that section
        setStyles(sectionDetails[sectionId]?.defaultStyles || {});
    }, [sectionId]);

    const handleStyleChange = (property: string, value: string | number) => {
        setStyles((prevStyles: any) => ({
            ...prevStyles,
            [property]: value,
        }));
    };

    const SelectedComponent = sectionId ? sectionComponents[sectionId] : null;
    const sectionName = sectionId ? sectionDetails[sectionId]?.name : "Section";

    const previewStyle = {
        backgroundColor: styles.bgColor,
        backgroundImage: `linear-gradient(to bottom, ${styles.bgColor}, ${styles.gradientColor})`,
        marginTop: `${styles.marginTop}px`,
        marginBottom: `${styles.marginBottom}px`,
        marginLeft: `${styles.marginLeft}px`,
        marginRight: `${styles.marginRight}px`,
        paddingTop: `${styles.paddingTop}px`,
        paddingBottom: `${styles.paddingBottom}px`,
        paddingLeft: `${styles.paddingLeft}px`,
        paddingRight: `${styles.paddingRight}px`,
    };

    return (
        <div className="space-y-6">
             <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/admin/sections">Sections</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                    <BreadcrumbPage>Edit {sectionName}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Preview */}
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Live Preview: {sectionName}</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <div className="border rounded-lg bg-background overflow-hidden">
                              <div style={previewStyle}>
                                {SelectedComponent ? <SelectedComponent removeBorder={true} /> : <p>Section not found.</p>}
                              </div>
                           </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Properties Editor */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>CSS Properties</CardTitle>
                            <CardDescription>Controls for the '{sectionName}' section.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Background Color</Label>
                                <Input type="color" value={styles.bgColor || '#FFFFFF'} onChange={(e) => handleStyleChange('bgColor', e.target.value)} className="h-12 w-full p-1" />
                            </div>
                            <div className="space-y-2">
                                <Label>Gradient Color</Label>
                                <Input type="color" value={styles.gradientColor || '#F0F8FF'} onChange={(e) => handleStyleChange('gradientColor', e.target.value)} className="h-12 w-full p-1" />
                            </div>
                            
                            <div className="space-y-4 rounded-md border p-4">
                                <Label>Margin (px)</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Input type="number" placeholder="Top" value={styles.marginTop} onChange={(e) => handleStyleChange('marginTop', e.target.valueAsNumber)} />
                                    <Input type="number" placeholder="Bottom" value={styles.marginBottom} onChange={(e) => handleStyleChange('marginBottom', e.target.valueAsNumber)} />
                                    <Input type="number" placeholder="Left" value={styles.marginLeft} onChange={(e) => handleStyleChange('marginLeft', e.target.valueAsNumber)} />
                                    <Input type="number" placeholder="Right" value={styles.marginRight} onChange={(e) => handleStyleChange('marginRight', e.target.valueAsNumber)} />
                                </div>
                            </div>

                            <div className="space-y-4 rounded-md border p-4">
                                <Label>Padding (px)</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Input type="number" placeholder="Top" value={styles.paddingTop} onChange={(e) => handleStyleChange('paddingTop', e.target.valueAsNumber)} />
                                    <Input type="number" placeholder="Bottom" value={styles.paddingBottom} onChange={(e) => handleStyleChange('paddingBottom', e.target.valueAsNumber)} />
                                    <Input type="number" placeholder="Left" value={styles.paddingLeft} onChange={(e) => handleStyleChange('paddingLeft', e.target.valueAsNumber)} />
                                    <Input type="number" placeholder="Right" value={styles.paddingRight} onChange={(e) => handleStyleChange('paddingRight', e.target.valueAsNumber)} />
                                </div>
                            </div>
                            
                            <div className="pt-4">
                                <Button className="w-full">Save Styles</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
