
"use client";

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { Brush, FileText, EyeOff, Trash2, GripVertical, PlusCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SectionStyleDialog } from './section-style-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

const pageData: { [key: string]: any } = {
  home: {
    name: "Home Page",
    sections: [
      { id: "inbox", name: "Inbox", isDynamic: true },
      { id: "why", name: "Why", isDynamic: false },
      { id: "features", name: "Features", isDynamic: false },
      { id: "exclusive-features", name: "Exclusive Features", isDynamic: false },
      { id: "comparison", name: "Comparison", isDynamic: false },
      { id: "pricing", name: "Pricing", isDynamic: true },
      { id: "blog", name: "Blog", isDynamic: true },
      { id: "testimonials", name: "Testimonials", isDynamic: false },
      { id: "faq", name: "FAQ", isDynamic: false },
      { id: "newsletter", name: "Newsletter", isDynamic: false },
    ]
  },
  "features": {
    name: "Features",
    sections: [
      { id: "top-title", name: "Top Title", isDynamic: false },
      { id: "features", name: "Features", isDynamic: false },
      { id: "exclusive-features", name: "Exclusive Features", isDynamic: false },
      { id: "comparison", name: "Comparison", isDynamic: false },
      { id: "faq", name: "FAQ", isDynamic: false },
      { id: "newsletter", name: "Newsletter", isDynamic: false },
    ],
  },
  "pricing": {
    name: "Pricing",
    sections: [
      { id: "top-title", name: "Top Title", isDynamic: false },
      { id: "pricing", name: "Pricing", isDynamic: true },
      { id: "pricing-comparison", name: "Price Comparison", isDynamic: true },
      { id: "faq", name: "FAQ", isDynamic: false },
      { id: "newsletter", name: "Newsletter", isDynamic: false },
    ],
  },
  "blog-page": {
      name: "Blog",
      sections: [
        { id: "top-title", name: "Top Title", isDynamic: false },
        { id: "blog", name: "Blog", isDynamic: true },
        { id: "faq", name: "FAQ", isDynamic: false },
        { id: "newsletter", name: "Newsletter", isDynamic: false },
      ]
  },
  "api": {
      name: "API",
      sections: [
        { id: "top-title", name: "Top Title", isDynamic: false },
        { id: "faq", name: "FAQ", isDynamic: false },
        { id: "newsletter", name: "Newsletter", isDynamic: false },
      ]
  },
  "about": { name: "About Us", sections: [] },
  "contact": { 
    name: "Contact Us", 
    sections: [
        { id: "contact-form", name: "Contact", isDynamic: true },
        { id: "faq", name: "FAQ", isDynamic: false },
    ]
  },
  "faq-page": { 
      name: "FAQ", 
      sections: [
        { id: "faq", name: "FAQ", isDynamic: false },
      ]
  },
  "terms": { name: "Terms of Service", sections: [] },
  "privacy": { name: "Privacy Policy", sections: [] },
};


export default function EditPageLayout() {
  const params = useParams();
  const router = useRouter();
  const pageId = params.id as string;
  const currentPage = pageData[pageId];

  const [editingSection, setEditingSection] = useState<any | null>(null);

  if (!currentPage) {
    return <div>Page not found.</div>;
  }
  
  const handleEditStyle = (section: any) => {
    setEditingSection(section);
  };
  
  const handleCloseDialog = () => {
    setEditingSection(null);
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
             <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          </div>

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
                        <TooltipContent><p>Edit Section Styles (Page Specific)</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <Button variant="ghost" size="icon" disabled={section.isDynamic}>
                            <FileText className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>{section.isDynamic ? 'Content is managed automatically' : 'Edit Content'}</p></TooltipContent>
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
                    <CardTitle>SEO Settings (2025)</CardTitle>
                     <CardDescription>Optimize this page for search engines.</CardDescription>
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
                </CardContent>
                <CardFooter>
                    <Button className="w-full">Save All Changes</Button>
                </CardFooter>
            </Card>
        </div>
      </div>
    </div>

    <SectionStyleDialog
      isOpen={!!editingSection}
      onClose={handleCloseDialog}
      section={editingSection}
      pageName={currentPage.name}
    />
    </>
  );
}
