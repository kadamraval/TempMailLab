
"use client";

import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { Loader2 } from "lucide-react";
import { PageSection } from "@/components/page-section";
import { collection, query, orderBy } from 'firebase/firestore';

const pageId = "home";

export default function HomePage() {
  const { isUserLoading } = useUser();
  const firestore = useFirestore();

  const sectionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, `pages/${pageId}/sections`), orderBy("order"));
  }, [firestore]);
  
  const { data: sectionsConfig, isLoading: isLoadingSections } = useCollection(sectionsQuery);

  if (isUserLoading || isLoadingSections) {
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

    