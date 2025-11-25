
"use client";

import { useState, useMemo } from 'react';
import { useParams, notFound } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brush, FileText, EyeOff, Trash2, GripVertical, PlusCircle, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SectionStyleDialog } from './section-style-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SectionContentDialog } from './section-content-dialog';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Plan } from '@/app/(admin)/admin/packages/data';

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

const TopTitlePlaceholder = ({ pageId }: { pageId: string }) => {
    const titles: Record<string, string> = {
        'home': "Temporary Email Address",
        'features-page': 'Features',
        'pricing-page': 'Pricing',
        'blog-page': 'Blog',
        'api-page': 'Developer API',
        'contact': 'Contact Us',
    }
    const descriptions: Record<string, string> = {
        'home': "A 100% Free & Secure way to keep your real inbox safe.",
        'features-page': 'Everything you need for secure and private communication, from basic privacy to advanced developer tools.',
        'pricing-page': 'Choose the plan that\'s right for you, with options for everyone from casual users to professional developers.',
        'blog-page': 'News, updates, and privacy tips from the Tempmailoz team.',
        'api-page': 'Integrate Tempmailoz\'s powerful temporary email functionality directly into your applications with our simple and robust REST API.',
        'contact': 'Have questions or need support? We\'re here to help.',
    }
    return (
     <div className="relative w-full max-w-4xl mx-auto text-center py-16">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter leading-tight bg-gradient-to-b from-primary to-accent text-transparent bg-clip-text">
            {titles[pageId] || "Page Title"}
        </h1>
        <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">{descriptions[pageId] || "This is a placeholder for the page subtitle or description."}</p>
    </div>
)}


const pageData: { [key: string]: any } = {
  home: {
    name: "Home Page",
    sections: [
      { id: "inbox", name: "Inbox", isDynamic: true, component: DashboardClient },
      { id: "why", name: "Why", isDynamic: false, component: UseCasesSection, props: { showTitle: true } },
      { id: "features", name: "Features", isDynamic: false, component: FeaturesSection, props: { showTitle: true } },
      { id: "exclusive-features", name: "Exclusive Features", isDynamic: false, component: ExclusiveFeatures, props: { showTitle: true } },
      { id: "comparison", name: "Comparison", isDynamic: false, component: ComparisonSection, props: { showTitle: true } },
      { id: "pricing", name: "Pricing", isDynamic: true, component: PricingSection, props: { showTitle: true } },
      { id: "blog", name: "Blog", isDynamic: true, component: BlogSection, props: { showTitle: true } },
      { id: "testimonials", name: "Testimonials", isDynamic: false, component: Testimonials },
      { id: "faq", name: "FAQ", isDynamic: false, component: FaqSection, props: { showTitle: true } },
      { id: "newsletter", name: "Newsletter", isDynamic: true, component: StayConnected },
    ]
  },
  "features-page": {
    name: "Features",
    sections: [
      { id: "top-title", name: "Top Title", isDynamic: true, component: TopTitlePlaceholder },
      { id: "features", name: "Features", isDynamic: false, component: FeaturesSection, props: { showTitle: false } },
      { id: "exclusive-features", name: "Exclusive Features", isDynamic: false, component: ExclusiveFeatures },
      { id: "comparison", name: "Comparison", isDynamic: false, component: ComparisonSection, props: { removeBorder: true } },
      { id: "faq", name: "FAQ", isDynamic: false, component: FaqSection },
      { id: "newsletter", name: "Newsletter", isDynamic: true, component: StayConnected },
    ],
  },
  "pricing-page": {
    name: "Pricing",
    sections: [
      { id: "top-title", name: "Top Title", isDynamic: true, component: TopTitlePlaceholder },
      { id: "pricing", name: "Pricing", isDynamic: true, component: PricingSection, props: { showTitle: false } },
      { id: "pricing-comparison", name: "Price Comparison", isDynamic: true, component: PricingComparisonTable },
      { id: "faq", name: "FAQ", isDynamic: false, component: FaqSection },
      { id: "newsletter", name: "Newsletter", isDynamic: true, component: StayConnected },
    ],
  },
  "blog-page": {
      name: "Blog",
      sections: [
        { id: "top-title", name: "Top Title", isDynamic: true, component: TopTitlePlaceholder },
        { id: "blog", name: "Blog", isDynamic: true, component: BlogSection, props: { showTitle: false } },
        { id: "faq", name: "FAQ", isDynamic: false, component: FaqSection },
        { id: "newsletter", name: "Newsletter", isDynamic: true, component: StayConnected },
      ]
  },
  "api-page": {
      name: "API",
      sections: [
        { id: "top-title", name: "Top Title", isDynamic: true, component: TopTitlePlaceholder },
        { id: "faq", name: "FAQ", isDynamic: false, component: FaqSection },
        { id: "newsletter", name: "Newsletter", isDynamic: true, component: StayConnected },
      ]
  },
  "contact": { 
    name: "Contact Us", 
    sections: [
        { id: "top-title", name: "Top Title", isDynamic: true, component: TopTitlePlaceholder },
        { id: "contact-form", name: "Contact", isDynamic: true, component: ContactPage },
        { id: "faq", name: "FAQ", isDynamic: false, component: FaqSection },
    ]
  },
  "faq-page": { 
      name: "FAQ", 
      sections: [
        { id: "faq", name: "FAQ", isDynamic: false, component: FaqSection },
      ]
  },
  "about": { name: "About Us", sections: [] },
  "terms": { name: "Terms of Service", sections: [] },
  "privacy": { name: "Privacy Policy", sections: [] },
};


export default function EditPageLayout() {
  const params = useParams();
  const pageId = params.id as string;
  const currentPage = pageData[pageId];

  const [editingStyleSection, setEditingStyleSection] = useState<any | null>(null);
  const [editingContentSection, setEditingContentSection] = useState<any | null>(null);
  
  const firestore = useFirestore();

  const plansQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "plans"), where("status", "==", "active"));
  }, [firestore]);

  const { data: plans, isLoading: isLoadingPlans } = useCollection<Plan>(plansQuery);
  
  if (!currentPage) {
    return notFound();
  }
  
  const handleEditStyle = (section: any) => {
    setEditingStyleSection(section);
  };
  
  const handleCloseStyleDialog = () => {
    setEditingStyleSection(null);
  };

  const handleEditContent = (section: any) => {
    setEditingContentSection(section);
  };
  
  const handleCloseContentDialog = () => {
    setEditingContentSection(null);
  };

  const getSectionProps = (sectionId: string, baseProps: any = {}) => {
      switch (sectionId) {
          case 'pricing':
          case 'pricing-comparison':
              return { ...baseProps, plans: plans || [] };
          case 'top-title':
          case 'inbox':
                return { ...baseProps, pageId: pageId };
          default:
              return { ...baseProps, pageId, sectionId };
      }
  }

  return (
    <>
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin/pages">Pages</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit: {currentPage.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           <div className="flex justify-between items-center">
             <h1 className="text-2xl font-bold tracking-tight">Page Sections</h1>
             <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          </div>
          {isLoadingPlans ? (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <TooltipProvider>
                <div className="space-y-4">
                {currentPage.sections.map((section: any) => (
                    <Card key={section.id}>
                    <CardHeader className="flex flex-row items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                        <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                        <CardTitle className="text-base font-medium">{section.name}</CardTitle>
                        </div>
                        <div className="flex items-center gap-1">
                        <Tooltip>
                            <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleEditStyle(section)}>
                                <Brush className="h-4 w-4" />
                            </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Edit Section Styles</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleEditContent(section)}>
                                <FileText className="h-4 w-4" />
                            </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Edit Content</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <EyeOff className="h-4 w-4" />
                            </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Hide Section</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Remove Section</p></TooltipContent>
                        </Tooltip>
                        </div>
                    </CardHeader>
                    </Card>
                ))}
                </div>
            </TooltipProvider>
          )}
        </div>

        <div className="lg:col-span-1 space-y-6">
           <Card>
                <CardHeader>
                    <CardTitle>Page Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="page-name">Page Name</Label>
                        <Input id="page-name" defaultValue={currentPage.name} />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                            <Label>Status</Label>
                            <CardDescription>
                                Draft pages are not visible to the public.
                            </CardDescription>
                        </div>
                        <Switch defaultChecked={true} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>SEO Settings</CardTitle>
                     <CardDescription>Optimize this page for search engines and social media.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="meta-title">Meta Title</Label>
                        <Input id="meta-title" placeholder="Enter meta title" />
                         <CardDescription className="text-xs">Recommended: 50-60 characters.</CardDescription>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="meta-description">Meta Description</Label>
                        <Textarea id="meta-description" placeholder="Enter meta description" rows={4}/>
                         <CardDescription className="text-xs">Recommended: 150-160 characters.</CardDescription>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="meta-keywords">Keywords</Label>
                        <Input id="meta-keywords" placeholder="e.g., temp mail, disposable email" />
                         <CardDescription className="text-xs">Comma-separated keywords.</CardDescription>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="canonical-url">Canonical URL</Label>
                        <Input id="canonical-url" placeholder="https://example.com/page" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="robots-meta">Robots Meta Tag</Label>
                        <Select defaultValue="index-follow">
                            <SelectTrigger id="robots-meta">
                                <SelectValue placeholder="Select a robots tag" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="index-follow">Index, Follow</SelectItem>
                                <SelectItem value="noindex-nofollow">No Index, No Follow</SelectItem>
                                <SelectItem value="noindex-follow">No Index, Follow</SelectItem>
                                <SelectItem value="index-nofollow">Index, No Follow</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <h4 className="font-medium text-sm mb-4">Open Graph (Social Sharing)</h4>
                        <div className="space-y-4 rounded-md border p-4">
                            <div className="space-y-2">
                                <Label htmlFor="og-title">OG Title</Label>
                                <Input id="og-title" placeholder="Title for social media" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="og-description">OG Description</Label>
                                <Textarea id="og-description" placeholder="Description for social media" rows={3}/>
                            </div>
                             <div className="space-y-2">
                                <Label>OG Image</Label>
                                <Input type="file" />
                                <CardDescription className="text-xs">Recommended size: 1200x630 pixels.</CardDescription>
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full">Save All Changes</Button>
                </CardFooter>
            </Card>
        </div>
      </div>
    </div>

    <SectionStyleDialog
      isOpen={!!editingStyleSection}
      onClose={handleCloseStyleDialog}
      section={editingStyleSection}
      pageId={pageId}
      pageName={currentPage.name}
    />
    <SectionContentDialog
        isOpen={!!editingContentSection}
        onClose={handleCloseContentDialog}
        section={editingContentSection}
        pageId={pageId}
    />
    </>
  );
}

    