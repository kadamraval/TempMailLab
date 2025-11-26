
"use client";

import { usePathname } from "next/navigation";
import { PageSection } from "@/components/page-section";
import { Loader2 } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from 'firebase/firestore';


export default function GenericPage() {
    const pathname = usePathname();
    const firestore = useFirestore();
    let pageId = pathname.substring(1);

    if (pageId.endsWith('/')) pageId = pageId.slice(0, -1);
    if (!pageId.endsWith('-page')) pageId += '-page';

    const sectionsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, `pages/${pageId}/sections`), orderBy("order"));
    }, [firestore, pageId]);
    
    const { data: sectionsConfig, isLoading: isLoadingSections } = useCollection(sectionsQuery);

    if (isLoadingSections) {
      return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }
    
    if (!sectionsConfig || sectionsConfig.length === 0) {
        return (
            <div className="container mx-auto py-20 text-center">
                <h1 className="text-4xl font-bold">Page Not Found</h1>
                <p className="text-muted-foreground mt-4">The page you're looking for doesn't exist or hasn't been configured yet.</p>
            </div>
        )
    }

    return (
        <>
            {(sectionsConfig || []).map((section) => (
                <PageSection
                    key={section.id}
                    pageId={pageId}
                    sectionId={section.id}
                    order={section.order}
                    isHidden={section.hidden}
                />
            ))}
        </>
    );
}

    