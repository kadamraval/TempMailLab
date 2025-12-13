
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

  // Find the 'inbox' section specifically to render DashboardClient
  const inboxSection = sectionsConfig?.find(s => s.id === 'inbox');

  return (
    <>
     {inboxSection ? (
        <PageSection
          key={inboxSection.id}
          pageId={pageId}
          sectionId={inboxSection.id}
          order={inboxSection.order}
          isHidden={inboxSection.hidden}
        />
     ) : (
      <div className="container mx-auto py-20 text-center">
        <h1 className="text-4xl font-bold">Inbox Not Configured</h1>
        <p className="text-muted-foreground mt-4">The main inbox section has not been added to the homepage in the admin panel.</p>
      </div>
     )}

     {(sectionsConfig || [])
      .filter(section => section.id !== 'inbox') // Render all other sections
      .map((section) => (
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

    