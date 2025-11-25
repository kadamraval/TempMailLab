
"use client";

import { useState, useMemo } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
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
import { collection, query, where, doc } from 'firebase/firestore';
import type { Plan } from '@/app/(admin)/admin/packages/data';

import { PageSection } from '@/components/page-section';

// This object defines the available sections and their default data/components.
const pageData: { [key: string]: any } = {
  home: {
    name: "Home Page",
    sections: [
      { id: "inbox", name: "Inbox" },
      { id: "why", name: "Why" },
      { id: "features", name: "Features" },
      { id: "exclusive-features", name: "Exclusive Features" },
      { id: "comparison", name: "Comparison" },
      { id: "pricing", name: "Pricing" },
      { id: "blog", name: "Blog" },
      { id: "testimonials", name: "Testimonials" },
      { id: "faq", name: "FAQ" },
      { id: "newsletter", name: "Newsletter" },
    ]
  },
  "features-page": {
    name: "Features",
    sections: [
      { id: "top-title", name: "Top Title" },
      { id: "features", name: "Features" },
      { id: "exclusive-features", name: "Exclusive Features" },
      { id: "comparison", name: "Comparison" },
      { id: "faq", name: "FAQ" },
      { id: "newsletter", name: "Newsletter" },
    ],
  },
  "pricing-page": {
    name: "Pricing",
    sections: [
      { id: "top-title", name: "Top Title" },
      { id: "pricing", name: "Pricing" },
      { id: "pricing-comparison", name: "Price Comparison" },
      { id: "faq", name: "FAQ" },
      { id: "newsletter", name: "Newsletter" },
    ],
  },
  "blog-page": {
      name: "Blog",
      sections: [
        { id: "top-title", name: "Top Title" },
        { id: "blog", name: "Blog" },
        { id: "faq", name: "FAQ" },
        { id: "newsletter", name: "Newsletter" },
      ]
  },
  "api-page": {
      name: "API",
      sections: [
        { id: "top-title", name: "Top Title" },
        { id: "faq", name: "FAQ" },
        { id: "newsletter", name: "Newsletter" },
      ]
  },
  "contact": { 
    name: "Contact Us", 
    sections: [
        { id: "top-title", name: "Top Title" },
        { id: "contact-form", name: "Contact" },
        { id: "faq", name: "FAQ" },
    ]
  },
  "faq-page": { 
      name: "FAQ", 
      sections: [
        { id: "faq", name: "FAQ" },
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
  const router = useRouter();

  const pageRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'pages', pageId);
  }, [firestore, pageId]);
  
  // Fetch sections subcollection for the current page
  const sectionsQuery = useMemoFirebase(() => {
    if (!pageRef) return null;
    return collection(pageRef, 'sections');
  }, [pageRef]);

  const { data: pageSections, isLoading: isLoadingSections } = useCollection(sectionsQuery);

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
             <Button onClick={() => router.push(`/${pageId === 'home' ? '' : pageId}`)} variant="outline">
              View Live Page
            </Button>
          </div>
          {isLoadingSections ? (
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

    