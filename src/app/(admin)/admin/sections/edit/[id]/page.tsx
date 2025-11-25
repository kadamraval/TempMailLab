
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
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
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';

// Preview Components
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
import { TopTitleSection } from '@/components/top-title-section';
import * as contentData from '@/lib/content-data';


const sectionComponents: { [key: string]: React.ComponentType<any> } = {
    "inbox": DashboardClient, "top-title": TopTitleSection, "why": UseCasesSection,
    "features": FeaturesSection, "exclusive-features": ExclusiveFeatures, "comparison": ComparisonSection,
    "pricing": PricingSection, "pricing-comparison": PricingComparisonTable, "blog": BlogSection,
    "testimonials": Testimonials, "faq": FaqSection, "newsletter": StayConnected,
    "contact-form": ContactPage,
};

const sectionDetails: { [key: string]: { name: string, defaultContent: any } } = {
    "inbox": { name: "Inbox", defaultContent: {} },
    "top-title": { name: "Top Title", defaultContent: { title: "Page Title", description: "Page subtitle" } },
    "why": { name: "Why", defaultContent: { title: "Why Temp Mail?", items: contentData.useCases } },
    "features": { name: "Features", defaultContent: { title: "Features", items: contentData.features } },
    "exclusive-features": { name: "Exclusive Features", defaultContent: { title: "Exclusive Features", items: contentData.exclusiveFeatures } },
    "comparison": { name: "Comparison", defaultContent: { title: "Comparison", items: contentData.comparisonFeatures } },
    "pricing": { name: "Pricing", defaultContent: { title: "Pricing" } },
    "pricing-comparison": { name: "Price Comparison", defaultContent: { title: "Price Comparison" } },
    "blog": { name: "Blog", defaultContent: { title: "From the Blog", items: contentData.blogPosts } },
    "testimonials": { name: "Testimonials", defaultContent: { title: "What Our Users Say", items: contentData.testimonials } },
    "faq": { name: "FAQ", defaultContent: { title: "Frequently Asked Questions", items: contentData.faqs } },
    "newsletter": { name: "Newsletter", defaultContent: { title: "Stay Connected" } },
    "contact-form": { name: "Contact", defaultContent: {} },
};

const ColorInput = ({ label, value, onChange }: { label: string, value: string, onChange: (value: string) => void }) => {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div className="flex items-center gap-2">
                <Input
                    type="color"
                    value={(value || '#000000').slice(0, 7)}
                    onChange={(e) => {
                        const currentVal = value || 'rgba(0,0,0,1)';
                        const alpha = parseFloat(currentVal.split(',')[3] || '1');
                        const newRgba = `rgba(${parseInt(e.target.value.slice(1, 3), 16)},${parseInt(e.target.value.slice(3, 5), 16)},${parseInt(e.target.value.slice(5, 7), 16)},${alpha})`;
                        onChange(newRgba);
                    }}
                    className="h-10 w-12 p-1"
                />
                 <Input
                    type="text"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="font-mono"
                />
            </div>
             <div className="flex items-center gap-2">
                <Label className="text-xs">Opacity</Label>
                <Input 
                    type="range" min="0" max="1" step="0.05"
                    value={(value || 'rgba(0,0,0,1)').match(/rgba?\(.*,\s*([\d.]+)\)/)?.[1] || '1'}
                    onChange={(e) => {
                        const newAlpha = e.target.value;
                        const oldColor = (value || 'rgba(0,0,0,1)').replace(/rgba?/, '').replace(')', '');
                        const [r,g,b] = oldColor.split(',');
                         onChange(`rgba(${r || 0},${g || 0},${b || 0}, ${newAlpha})`);
                    }}
                />
            </div>
        </div>
    );
};
const BorderInputGroup = ({ side, styles, handleStyleChange }: { side: 'Top' | 'Bottom', styles: any, handleStyleChange: (prop: string, value: any) => void }) => {
    return (
        <div className="space-y-3">
            <Label className="font-semibold">{side} Border</Label>
            <div className="grid grid-cols-2 gap-2">
                <div className='space-y-2'>
                    <Label htmlFor={`border${side}Width`} className='text-xs'>Size (px)</Label>
                    <Input id={`border${side}Width`} type="number" placeholder="Size" value={styles[`border${side}Width`] || 0} onChange={(e) => handleStyleChange(`border${side}Width`, e.target.valueAsNumber)} />
                </div>
                <div className='space-y-2'>
                    <Label htmlFor={`border${side}Color`} className='text-xs'>Color</Label>
                    <Input id={`border${side}Color`} type="text" value={styles[`border${side}Color`] || 'hsl(var(--border))'} onChange={(e) => handleStyleChange(`border${side}Color`, e.target.value)} />
                </div>
            </div>
        </div>
    )
};


export default function EditSectionPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const firestore = useFirestore();
    const sectionId = params.id as string;
    
    const [styles, setStyles] = useState<any>({});
    const [isSaving, setIsSaving] = useState(false);

    const sectionRef = useMemoFirebase(() => {
        if (!firestore || !sectionId) return null;
        return doc(firestore, "sections", sectionId);
    }, [firestore, sectionId]);
    
    const {data: savedStyles, isLoading} = useDoc(sectionRef);

    useEffect(() => {
        const defaultStyles = {
            marginTop: 0, marginBottom: 0, paddingTop: 64, paddingBottom: 64, paddingLeft: 16, paddingRight: 16,
            borderTopWidth: 0, borderBottomWidth: 0, borderTopColor: 'hsl(var(--border))', borderBottomColor: 'hsl(var(--border))',
            bgColor: 'hsl(var(--background))', useGradient: false, gradientStart: 'hsl(var(--background))', gradientEnd: 'hsl(var(--accent))'
        };
        
        if (savedStyles) {
            setStyles({ ...defaultStyles, ...savedStyles });
        } else if (!isLoading) {
            setStyles(defaultStyles);
        }
    }, [savedStyles, isLoading]);

    const handleStyleChange = (property: string, value: any) => {
        setStyles((prevStyles: any) => ({ ...prevStyles, [property]: value }));
    };

    const handleSaveStyles = async () => {
        if (!sectionRef) return;
        setIsSaving(true);
        try {
            await setDoc(sectionRef, styles, { merge: true });
            toast({
                title: "Styles Saved!",
                description: `The default styles for the '${sectionName}' section have been updated.`,
            });
            router.refresh();
        } catch (error: any) {
            toast({ title: "Error Saving", description: error.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    if (!sectionId || !sectionDetails[sectionId]) {
        return notFound();
    }

    const SelectedComponent = sectionComponents[sectionId];
    const sectionName = sectionDetails[sectionId]?.name;
    const defaultContent = sectionDetails[sectionId]?.defaultContent;

    const previewStyle = {
        backgroundColor: styles.bgColor || 'transparent',
        backgroundImage: styles.useGradient ? `linear-gradient(to bottom, ${styles.gradientStart}, ${styles.gradientEnd})` : 'none',
        marginTop: `${styles.marginTop || 0}px`,
        marginBottom: `${styles.marginBottom || 0}px`,
        paddingTop: `${styles.paddingTop || 0}px`,
        paddingBottom: `${styles.paddingBottom || 0}px`,
        paddingLeft: `${styles.paddingLeft || 0}px`,
        paddingRight: `${styles.paddingRight || 0}px`,
        borderTop: `${styles.borderTopWidth || 0}px solid ${styles.borderTopColor || 'transparent'}`,
        borderBottom: `${styles.borderBottomWidth || 0}px solid ${styles.borderBottomColor || 'transparent'}`,
    };
    
    if (isLoading) {
        return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

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
                    <BreadcrumbPage>Edit Default: {sectionName}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Preview */}
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Live Preview: {sectionName}</CardTitle>
                             <CardDescription>This preview shows how this section will look by default on all pages.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <div className="border rounded-lg bg-background overflow-hidden">
                              <div style={previewStyle}>
                                {SelectedComponent ? <SelectedComponent content={defaultContent} removeBorder={true} /> : <p>Section preview not available.</p>}
                              </div>
                           </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Properties Editor */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Default CSS Properties</CardTitle>
                            <CardDescription>Set the global default styles for the '{sectionName}' section.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
                            {/* Background Controls */}
                            <div className="space-y-4 rounded-md border p-4">
                                <Label className="font-semibold">Background</Label>
                                <div className="space-y-4">
                                    <ColorInput label="Background Color" value={styles.bgColor} onChange={(value) => handleStyleChange('bgColor', value)} />
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="use-gradient">Use Gradient</Label>
                                        <Switch id="use-gradient" checked={styles.useGradient} onCheckedChange={(checked) => handleStyleChange('useGradient', checked)} />
                                    </div>
                                    {styles.useGradient && (
                                        <>
                                            <ColorInput label="Gradient Start Color (Top)" value={styles.gradientStart} onChange={(value) => handleStyleChange('gradientStart', value)} />
                                            <ColorInput label="Gradient End Color (Bottom)" value={styles.gradientEnd} onChange={(value) => handleStyleChange('gradientEnd', value)} />
                                        </>
                                    )}
                                </div>
                            </div>

                             {/* Border Controls */}
                            <div className="space-y-4 rounded-md border p-4">
                                <Label className="font-semibold">Borders</Label>
                                <div className="space-y-4">
                                    <BorderInputGroup side="Top" styles={styles} handleStyleChange={handleStyleChange} />
                                    <Separator />
                                    <BorderInputGroup side="Bottom" styles={styles} handleStyleChange={handleStyleChange} />
                                </div>
                            </div>
                            
                            {/* Margin and Padding */}
                            <div className="space-y-4 rounded-md border p-4">
                                <Label className="font-semibold">Spacing (in pixels)</Label>
                                <div className="space-y-2">
                                     <Label className="text-xs">Margin (Outer Space)</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input type="number" placeholder="Top" value={styles.marginTop} onChange={(e) => handleStyleChange('marginTop', e.target.valueAsNumber)} />
                                        <Input type="number" placeholder="Bottom" value={styles.marginBottom} onChange={(e) => handleStyleChange('marginBottom', e.target.valueAsNumber)} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                     <Label className="text-xs">Padding (Inner Space)</Label>
                                     <div className="grid grid-cols-2 gap-2">
                                        <Input type="number" placeholder="Top" value={styles.paddingTop} onChange={(e) => handleStyleChange('paddingTop', e.target.valueAsNumber)} />
                                        <Input type="number" placeholder="Bottom" value={styles.paddingBottom} onChange={(e) => handleStyleChange('paddingBottom', e.target.valueAsNumber)} />
                                        <Input type="number" placeholder="Left" value={styles.paddingLeft} onChange={(e) => handleStyleChange('paddingLeft', e.target.valueAsNumber)} />
                                        <Input type="number" placeholder="Right" value={styles.paddingRight} onChange={(e) => handleStyleChange('paddingRight', e.target.valueAsNumber)} />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="pt-4">
                                <Button className="w-full" onClick={handleSaveStyles} disabled={isSaving}>
                                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Default Styles
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
