
"use client";

import { usePathname } from "next/navigation";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { PageSection } from "@/components/page-section";
import { Loader2 } from "lucide-react";

// The order of sections for generic pages
const sectionsConfig = [
    { id: "top-title" },
    { id: "features" },
    { id: "exclusive-features" },
    { id: "comparison" },
    { id: "pricing" },
    { id: "pricing-comparison" },
    { id: "blog" },
    { id: "faq" },
    { id: "contact-form" },
    { id: "newsletter" },
];

export default function GenericPage() {
    const pathname = usePathname();
    // Derive pageId from the slug, e.g., /features -> features
    const pageId = pathname.substring(1).split('/')[0]; 
    const firestore = useFirestore();

    const sectionsQuery = useMemoFirebase(() => {
        if (!firestore || !pageId) return null;
        return query(collection(firestore, 'pages', pageId, 'sections'), orderBy('order', 'asc'));
    }, [firestore, pageId]);

    const { data: pageSections, isLoading: isLoadingSections } = useCollection(sectionsQuery);

    if (isLoadingSections) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    const sectionDataMap = new Map(pageSections?.map(s => [s.id, s]));
    
    // Filter and sort the config based on what's available for this page
    const availableSections = sectionsConfig
        .map(config => sectionDataMap.get(config.id))
        .filter(Boolean);

    return (
        <div className="py-16 sm:py-20">
            {availableSections.map((section: any, index) => (
                <PageSection
                    key={section.id || index}
                    pageId={pageId}
                    sectionId={section.id}
                    order={index}
                />
            ))}
        </div>
    );
}

    