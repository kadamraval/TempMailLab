"use client";

import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { Loader2 } from "lucide-react";
import { PageSection } from "@/components/page-section";
import { collection, query, orderBy } from 'firebase/firestore';

const pageId = "api-page";

export default function ApiPage() {
    const firestore = useFirestore();

    const sectionsQuery = useMemoFirebase(() => {
      if (!firestore) return null;
      return query(collection(firestore, `pages/${pageId}/sections`), orderBy("order"));
    }, [firestore]);
    
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
                <h1 className="text-4xl font-bold">API Page Not Configured</h1>
                <p className="text-muted-foreground mt-4">This page has no sections assigned to it yet. Please add sections in the admin panel.</p>
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
