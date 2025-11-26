
"use client";

import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { Loader2 } from "lucide-react";
import { PageSection } from "@/components/page-section";
import { collection, query, orderBy } from 'firebase/firestore';

const pageId = "features-page";

export default function FeaturesPage() {
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

    