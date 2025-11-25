
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
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

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
    "inbox": { name: "Inbox", defaultStyles: { bgColor: 'hsla(var(--background))', useGradient: true, gradientStart: 'hsla(var(--background))', gradientEnd: 'hsla(var(--gradient-start) / 0.3)', marginTop: 64, marginBottom: 64, marginLeft: 0, marginRight: 0, paddingTop: 64, paddingBottom: 64, paddingLeft: 16, paddingRight: 16, borderTopWidth: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderRightWidth: 0, borderTopColor: '#E5E7EB', borderBottomColor: '#E5E7EB', borderLeftColor: '#E5E7EB', borderRightColor: '#E5E7EB' } },
    "top-title": { name: "Top Title", defaultStyles: { bgColor: 'hsla(var(--background))', useGradient: true, gradientStart: 'hsla(var(--background))', gradientEnd: 'hsla(var(--gradient-start) / 0.3)', marginTop: 64, marginBottom: 64, marginLeft: 0, marginRight: 0, paddingTop: 0, paddingBottom: 0, paddingLeft: 16, paddingRight: 16, borderTopWidth: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderRightWidth: 0, borderTopColor: '#E5E7EB', borderBottomColor: '#E5E7EB', borderLeftColor: '#E5E7EB', borderRightColor: '#E5E7EB' } },
    "why": { name: "Why", defaultStyles: { bgColor: 'hsla(var(--background))', useGradient: true, gradientStart: 'hsla(var(--background))', gradientEnd: 'hsla(var(--gradient-start) / 0.3)', marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0, paddingTop: 64, paddingBottom: 64, paddingLeft: 16, paddingRight: 16, borderTopWidth: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderRightWidth: 0, borderTopColor: '#E5E7EB', borderBottomColor: '#E5E7EB', borderLeftColor: '#E5E7EB', borderRightColor: '#E5E7EB' } },
    "features": { name: "Features", defaultStyles: { bgColor: '#F5F5F5', useGradient: true, gradientStart: 'hsla(var(--background))', gradientEnd: 'hsla(var(--gradient-end) / 0.3)', marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0, paddingTop: 64, paddingBottom: 64, paddingLeft: 16, paddingRight: 16, borderTopWidth: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderRightWidth: 0, borderTopColor: '#E5E7EB', borderBottomColor: '#E5E7EB', borderLeftColor: '#E5E7EB', borderRightColor: '#E5E7EB' } },
    "exclusive-features": { name: "Exclusive Features", defaultStyles: { bgColor: 'hsla(var(--background))', useGradient: true, gradientStart: 'hsla(var(--background))', gradientEnd: 'hsla(var(--gradient-start) / 0.3)', marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0, paddingTop: 64, paddingBottom: 64, paddingLeft: 16, paddingRight: 16, borderTopWidth: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderRightWidth: 0, borderTopColor: '#E5E7EB', borderBottomColor: '#E5E7EB', borderLeftColor: '#E5E7EB', borderRightColor: '#E5E7EB' } },
    "comparison": { name: "Comparison", defaultStyles: { bgColor: '#F5F5F5', useGradient: true, gradientStart: 'hsla(var(--background))', gradientEnd: 'hsla(var(--gradient-end) / 0.3)', marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0, paddingTop: 64, paddingBottom: 64, paddingLeft: 16, paddingRight: 16, borderTopWidth: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderRightWidth: 0, borderTopColor: '#E5E7EB', borderBottomColor: '#E5E7EB', borderLeftColor: '#E5E7EB', borderRightColor: '#E5E7EB' } },
    "pricing": { name: "Pricing", defaultStyles: { bgColor: 'hsla(var(--background))', useGradient: true, gradientStart: 'hsla(var(--background))', gradientEnd: 'hsla(var(--gradient-start) / 0.3)', marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0, paddingTop: 64, paddingBottom: 64, paddingLeft: 16, paddingRight: 16, borderTopWidth: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderRightWidth: 0, borderTopColor: '#E5E7EB', borderBottomColor: '#E5E7EB', borderLeftColor: '#E5E7EB', borderRightColor: '#E5E7EB' } },
    "pricing-comparison": { name: "Price Comparison", defaultStyles: { bgColor: '#F5F5F5', useGradient: true, gradientStart: 'hsla(var(--background))', gradientEnd: 'hsla(var(--gradient-end) / 0.3)', marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0, paddingTop: 64, paddingBottom: 64, paddingLeft: 16, paddingRight: 16, borderTopWidth: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderRightWidth: 0, borderTopColor: '#E5E7EB', borderBottomColor: '#E5E7EB', borderLeftColor: '#E5E7EB', borderRightColor: '#E5E7EB' } },
    "blog": { name: "Blog", defaultStyles: { bgColor: 'hsla(var(--background))', useGradient: true, gradientStart: 'hsla(var(--background))', gradientEnd: 'hsla(var(--gradient-start) / 0.3)', marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0, paddingTop: 64, paddingBottom: 64, paddingLeft: 16, paddingRight: 16, borderTopWidth: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderRightWidth: 0, borderTopColor: '#E5E7EB', borderBottomColor: '#E5E7EB', borderLeftColor: '#E5E7EB', borderRightColor: '#E5E7EB' } },
    "testimonials": { name: "Testimonials", defaultStyles: { bgColor: '#F5F5F5', useGradient: true, gradientStart: 'hsla(var(--background))', gradientEnd: 'hsla(var(--gradient-end) / 0.3)', marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0, paddingTop: 64, paddingBottom: 64, paddingLeft: 16, paddingRight: 16, borderTopWidth: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderRightWidth: 0, borderTopColor: '#E5E7EB', borderBottomColor: '#E5E7EB', borderLeftColor: '#E5E7EB', borderRightColor: '#E5E7EB' } },
    "faq": { name: "FAQ", defaultStyles: { bgColor: 'hsla(var(--background))', useGradient: true, gradientStart: 'hsla(var(--background))', gradientEnd: 'hsla(var(--gradient-start) / 0.3)', marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0, paddingTop: 64, paddingBottom: 64, paddingLeft: 16, paddingRight: 16, borderTopWidth: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderRightWidth: 0, borderTopColor: '#E5E7EB', borderBottomColor: '#E5E7EB', borderLeftColor: '#E5E7EB', borderRightColor: '#E5E7EB' } },
    "newsletter": { name: "Newsletter", defaultStyles: { bgColor: '#F5F5F5', useGradient: true, gradientStart: 'hsla(var(--background))', gradientEnd: 'hsla(var(--gradient-end) / 0.3)', marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0, paddingTop: 64, paddingBottom: 64, paddingLeft: 16, paddingRight: 16, borderTopWidth: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderRightWidth: 0, borderTopColor: '#E5E7EB', borderBottomColor: '#E5E7EB', borderLeftColor: '#E5E7EB', borderRightColor: '#E5E7EB' } },
    "contact-form": { name: "Contact", defaultStyles: { bgColor: 'hsla(var(--background))', useGradient: true, gradientStart: 'hsla(var(--background))', gradientEnd: 'hsla(var(--gradient-start) / 0.3)', marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0, paddingTop: 64, paddingBottom: 64, paddingLeft: 16, paddingRight: 16, borderTopWidth: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderRightWidth: 0, borderTopColor: '#E5E7EB', borderBottomColor: '#E5E7EB', borderLeftColor: '#E5E7EB', borderRightColor: '#E5E7EB' } },
    "knowledgebase": { name: "Knowledgebase", defaultStyles: { bgColor: 'hsla(var(--background))', useGradient: true, gradientStart: 'hsla(var(--background))', gradientEnd: 'hsla(var(--gradient-start) / 0.3)', marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0, paddingTop: 64, paddingBottom: 64, paddingLeft: 16, paddingRight: 16, borderTopWidth: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderRightWidth: 0, borderTopColor: '#E5E7EB', borderBottomColor: '#E5E7EB', borderLeftColor: '#E5E7EB', borderRightColor: '#E5E7EB' } },
};

const ColorInput = ({ label, value, onChange }: { label: string, value: string, onChange: (value: string) => void }) => {
    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // This function will convert hex with alpha to rgba for the state
        const hex = e.target.value; // Format is #RRGGBBAA
        if (/^#([0-9A-Fa-f]{8})$/.test(hex)) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            const a = parseInt(hex.slice(7, 9), 16) / 255;
            onChange(`rgba(${r},${g},${b},${a.toFixed(2)})`);
        }
    };

    const colorPickerValue = useMemo(() => {
        // This function converts rgba back to hex for the color picker
        const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (match) {
            const [, r, g, b, a = '1'] = match;
            const toHex = (c: string) => parseInt(c).toString(16).padStart(2, '0');
            const alphaHex = Math.round(parseFloat(a) * 255).toString(16).padStart(2, '0');
            return `#${toHex(r)}${toHex(g)}${toHex(b)}${alphaHex}`;
        }
        return '#000000ff'; // Fallback
    }, [value]);


    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div className="flex items-center gap-2">
                <Input
                    type="color"
                    value={colorPickerValue.slice(0, 7)} // Picker doesn't use alpha
                    onChange={(e) => {
                        const newRgba = `rgba(${parseInt(e.target.value.slice(1, 3), 16)},${parseInt(e.target.value.slice(3, 5), 16)},${parseInt(e.target.value.slice(5, 7), 16)},${parseFloat(value.split(',')[3] || '1')})`;
                        onChange(newRgba);
                    }}
                    className="h-10 w-12 p-1"
                />
                 <Input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="font-mono"
                />
            </div>
             <div className="flex items-center gap-2">
                <Label className="text-xs">Opacity</Label>
                <Input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.05"
                    value={value.match(/rgba?\(.*,\s*([\d.]+)\)/)?.[1] || '1'}
                    onChange={(e) => {
                        const newAlpha = e.target.value;
                        const oldColor = value.replace(/rgba?/, '').replace(')', '');
                        const [r,g,b] = oldColor.split(',');
                         onChange(`rgba(${r},${g},${b}, ${newAlpha})`);
                    }}
                />
            </div>
        </div>
    );
};
const BorderInputGroup = ({ side, styles, handleStyleChange }: { side: 'Top' | 'Bottom' | 'Left' | 'Right', styles: any, handleStyleChange: (prop: string, value: any) => void }) => {
    const lowerSide = side.toLowerCase();
    return (
        <div className="space-y-3">
            <Label className="font-semibold">{side} Border</Label>
            <div className="grid grid-cols-2 gap-2">
                <div className='space-y-2'>
                    <Label htmlFor={`border${side}Width`} className='text-xs'>Size (px)</Label>
                    <Input id={`border${side}Width`} type="number" placeholder="Size" value={styles[`border${side}Width`]} onChange={(e) => handleStyleChange(`border${side}Width`, e.target.valueAsNumber)} />
                </div>
                <div className='space-y-2'>
                    <Label htmlFor={`border${side}Color`} className='text-xs'>Color</Label>
                    <Input id={`border${side}Color`} type="color" value={styles[`border${side}Color`]} onChange={(e) => handleStyleChange(`border${side}Color`, e.target.value)} className="h-10 w-full p-1" />
                </div>
            </div>
        </div>
    )
};


export default function EditSectionPage() {
    const params = useParams();
    const sectionId = params.id as string;
    
    const [styles, setStyles] = useState(sectionDetails[sectionId]?.defaultStyles || {});
    const [useBackground, setUseBackground] = useState(true);

    useEffect(() => {
        // When the sectionId changes, reset the styles to the default for that section
        setStyles(sectionDetails[sectionId]?.defaultStyles || {});
    }, [sectionId]);

    const handleStyleChange = (property: string, value: string | number | boolean) => {
        setStyles((prevStyles: any) => ({
            ...prevStyles,
            [property]: value,
        }));
    };

    const SelectedComponent = sectionId ? sectionComponents[sectionId] : null;
    const sectionName = sectionId ? sectionDetails[sectionId]?.name : "Section";

    const previewStyle = {
        backgroundColor: useBackground ? styles.bgColor : 'transparent',
        backgroundImage: useBackground && styles.useGradient ? `linear-gradient(to bottom, ${styles.gradientStart}, ${styles.gradientEnd})` : 'none',
        marginTop: `${styles.marginTop}px`,
        marginBottom: `${styles.marginBottom}px`,
        marginLeft: `${styles.marginLeft}px`,
        marginRight: `${styles.marginRight}px`,
        paddingTop: `${styles.paddingTop}px`,
        paddingBottom: `${styles.paddingBottom}px`,
        paddingLeft: `${styles.paddingLeft}px`,
        paddingRight: `${styles.paddingRight}px`,
        borderTop: `${styles.borderTopWidth}px solid ${styles.borderTopColor}`,
        borderBottom: `${styles.borderBottomWidth}px solid ${styles.borderBottomColor}`,
        borderLeft: `${styles.borderLeftWidth}px solid ${styles.borderLeftColor}`,
        borderRight: `${styles.borderRightWidth}px solid ${styles.borderRightColor}`,
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
                            {/* Background Controls */}
                            <div className="space-y-4 rounded-md border p-4">
                                <div className="flex items-center justify-between">
                                    <Label className="font-semibold">Background</Label>
                                    <Switch checked={useBackground} onCheckedChange={setUseBackground} />
                                </div>
                                {useBackground && (
                                    <div className="space-y-4">
                                        <ColorInput label="Background Color" value={styles.bgColor || 'rgba(255,255,255,1)'} onChange={(value) => handleStyleChange('bgColor', value)} />
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="use-gradient">Use Gradient</Label>
                                            <Switch id="use-gradient" checked={styles.useGradient} onCheckedChange={(checked) => handleStyleChange('useGradient', checked)} />
                                        </div>
                                        {styles.useGradient && (
                                            <>
                                                <ColorInput label="Gradient Start Color (Top)" value={styles.gradientStart || 'rgba(255,255,255,1)'} onChange={(value) => handleStyleChange('gradientStart', value)} />
                                                <ColorInput label="Gradient End Color (Bottom)" value={styles.gradientEnd || 'rgba(240,248,255,1)'} onChange={(value) => handleStyleChange('gradientEnd', value)} />
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                             {/* Border Controls */}
                            <div className="space-y-4 rounded-md border p-4">
                                <Label className="font-semibold">Borders</Label>
                                <div className="space-y-4">
                                    <BorderInputGroup side="Top" styles={styles} handleStyleChange={handleStyleChange} />
                                    <Separator />
                                    <BorderInputGroup side="Bottom" styles={styles} handleStyleChange={handleStyleChange} />
                                    <Separator />
                                    <BorderInputGroup side="Left" styles={styles} handleStyleChange={handleStyleChange} />
                                    <Separator />
                                    <BorderInputGroup side="Right" styles={styles} handleStyleChange={handleStyleChange} />
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
                                        <Input type="number" placeholder="Left" value={styles.marginLeft} onChange={(e) => handleStyleChange('marginLeft', e.target.valueAsNumber)} />
                                        <Input type="number" placeholder="Right" value={styles.marginRight} onChange={(e) => handleStyleChange('marginRight', e.target.valueAsNumber)} />
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
                                <Button className="w-full">Save Styles</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

    