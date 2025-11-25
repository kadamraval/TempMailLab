
"use client";

import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UseCasesSection } from '@/components/use-cases-section';
import { FeaturesSection } from '@/components/features-section';
import { Testimonials } from '@/components/testimonials';
import { FaqSection } from '@/components/faq-section';
import { ExclusiveFeatures } from '@/components/exclusive-features';
import { ComparisonSection } from '@/components/comparison-section';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import Link from 'next/link';
import { PricingSection } from '@/components/pricing-section';
import { PricingComparisonTable } from '@/components/pricing-comparison-table';
import { BlogSection } from '@/components/blog-section';
import { StayConnected } from '@/components/stay-connected';
import ContactPage from '@/app/(main)/contact/page';

const KnowledgebasePlaceholder = () => (
    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
        <p className="text-lg font-semibold">Knowledgebase Section</p>
        <p>Content for this section will be managed here in the future.</p>
    </div>
);

const sectionComponents: { [key: string]: React.ComponentType<any> } = {
    "use-cases": UseCasesSection,
    "features": FeaturesSection,
    "exclusive-features": ExclusiveFeatures,
    "comparison": ComparisonSection,
    "pricing": PricingSection,
    "pricing-comparison": PricingComparisonTable,
    "blog": BlogSection,
    "testimonials": Testimonials,
    "faq": FaqSection,
    "stay-connected": StayConnected,
    "contact-form": ContactPage,
    "knowledgebase": KnowledgebasePlaceholder,
};

const sectionDetails: { [key: string]: { name: string } } = {
    "use-cases": { name: "Why" },
    "features": { name: "Features" },
    "exclusive-features": { name: "Exclusive Features" },
    "comparison": { name: "Comparison" },
    "pricing": { name: "Pricing" },
    "pricing-comparison": { name: "Price Comparison" },
    "blog": { name: "Blog" },
    "testimonials": { name: "Testimonials" },
    "faq": { name: "FAQ" },
    "stay-connected": { name: "Newsletter" },
    "contact-form": { name: "Contact" },
    "knowledgebase": { name: "Knowledgebase" },
};

export default function EditSectionPage() {
    const params = useParams();
    const sectionId = params.id as string;
    
    const SelectedComponent = sectionId ? sectionComponents[sectionId] : null;
    const sectionName = sectionId ? sectionDetails[sectionId]?.name : "Section";

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
                           <div className="border rounded-lg p-4 bg-background">
                              {SelectedComponent ? <SelectedComponent removeBorder={true} /> : <p>Section not found.</p>}
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
                                <Input type="color" defaultValue="#FFFFFF" className="h-12 w-full p-1" />
                            </div>
                            <div className="space-y-2">
                                <Label>Gradient Color</Label>
                                <Input type="color" defaultValue="#F0F8FF" className="h-12 w-full p-1" />
                            </div>
                            
                            <div className="space-y-4 rounded-md border p-4">
                                <Label>Margin (px)</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Input type="number" placeholder="Top" />
                                    <Input type="number" placeholder="Bottom" />
                                    <Input type="number" placeholder="Left" />
                                    <Input type="number" placeholder="Right" />
                                </div>
                            </div>

                            <div className="space-y-4 rounded-md border p-4">
                                <Label>Padding (px)</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Input type="number" placeholder="Top" defaultValue="64" />
                                    <Input type="number" placeholder="Bottom" defaultValue="64"/>
                                    <Input type="number" placeholder="Left" />
                                    <Input type="number" placeholder="Right" />
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
