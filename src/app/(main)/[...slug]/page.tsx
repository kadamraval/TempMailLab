
"use client";

import { usePathname, notFound } from "next/navigation";
import { PageSection } from "@/components/page-section";
import { Loader2 } from "lucide-react";

// The order of sections for generic pages
// The Top Title will always be first.
const pageSectionConfig: { [key: string]: string[] } = {
  'faq-page': ['faq'],
};

const defaultSections = ["top-title", "faq", "newsletter"];

export default function GenericPage() {
    const pathname = usePathname();
    // Derive pageId from the slug, e.g., /features -> features-page
    const pageId = (pathname.substring(1) || 'home') + '-page';

    // Simple check if page exists, could be more robust
    if (!pageSectionConfig[pageId] && !['about-page', 'terms-page', 'privacy-page'].includes(pageId)) {
      // notFound(); // This would be for a real 404
      // For now, render a simple placeholder
       return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
          <PageSection pageId={pageId} sectionId="top-title" order={0} />
          <p className="mt-8 text-muted-foreground">Content for this page is coming soon.</p>
        </div>
      );
    }
    
    const sectionsToRender = pageSectionConfig[pageId] || defaultSections;

    return (
        <div className="py-16 sm:py-20">
            {sectionsToRender.map((sectionId, index) => (
                <PageSection
                    key={sectionId}
                    pageId={pageId}
                    sectionId={sectionId}
                    order={index}
                />
            ))}
        </div>
    );
}
