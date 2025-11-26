
"use client";

import { usePathname, notFound } from "next/navigation";
import { PageSection } from "@/components/page-section";
import { Loader2 } from "lucide-react";

// This layout now also handles the 'features' page to ensure consistency
const pageSectionConfig: { [key: string]: string[] } = {
  'features-page': ["top-title", "features", "exclusive-features", "comparison", "faq", "newsletter"],
  'faq-page': ['faq'],
};

// All pages handled by this dynamic route will have this layout wrapper.
const PageWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="py-16 sm:py-20">{children}</div>
);

export default function GenericPage() {
    const pathname = usePathname();
    // Derive pageId from the slug, e.g., /features -> features-page
    let pageId = pathname.substring(1)
    if (!pageId.endsWith('-page')) {
      pageId += '-page';
    }

    const sectionsToRender = pageSectionConfig[pageId];

    // If there's no specific section config, it might be a simple content page.
    if (!sectionsToRender) {
       return (
        <PageWrapper>
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-400px)] text-center">
            <PageSection pageId={pageId} sectionId="top-title" order={0} />
            <p className="mt-8 text-muted-foreground">Content for this page is coming soon.</p>
          </div>
        </PageWrapper>
      );
    }

    return (
        <PageWrapper>
            {sectionsToRender.map((sectionId, index) => (
                <PageSection
                    key={sectionId}
                    pageId={pageId}
                    sectionId={sectionId}
                    order={index}
                />
            ))}
        </PageWrapper>
    );
}
