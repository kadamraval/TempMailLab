
"use client";

import { usePathname, notFound } from "next/navigation";
import { PageSection } from "@/components/page-section";
import { Loader2 } from "lucide-react";

// The order of sections for generic pages
// The Top Title will always be first.
const pageSectionConfig: { [key: string]: string[] } = {
  'features-page': ["top-title", "features", "exclusive-features", "comparison", "faq", "newsletter"],
  'faq-page': ['faq'],
};

const defaultSections = ["top-title", "faq", "newsletter"];

export default function GenericPage() {
    const pathname = usePathname();
    // Derive pageId from the slug, e.g., /features -> features-page
    let pageId = pathname.substring(1)
    if (!pageId.endsWith('-page')) {
      pageId += '-page';
    }


    // Simple check if page exists, could be more robust
    if (!pageSectionConfig[pageId] && !['about-page', 'terms-page', 'privacy-page'].includes(pageId)) {
       return (
        <div className="py-16 sm:py-20">
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-400px)] text-center">
            <PageSection pageId={pageId} sectionId="top-title" order={0} />
            <p className="mt-8 text-muted-foreground">Content for this page is coming soon.</p>
          </div>
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
