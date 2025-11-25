
"use client";

import { useUser } from "@/firebase/auth/use-user";
import { Loader2 } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from 'firebase/firestore';
import { PageSection } from "@/components/page-section";

const pageId = "home";

// Defines the order and IDs of sections to be rendered
const sectionsConfig = [
    { id: "inbox" },
    { id: "why" },
    { id: "features" },
    { id: "exclusive-features" },
    { id: "comparison" },
    { id: "pricing" },
    { id: "blog" },
    { id: "testimonials" },
    { id: "faq" },
    { id: "newsletter" },
];


export default function HomePage() {
  const { isUserLoading } = useUser();
  const firestore = useFirestore();

  // Fetch all sections for the 'home' page and order them
  const sectionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'pages', pageId, 'sections'), orderBy('order', 'asc'));
  }, [firestore]);

  const { data: pageSections, isLoading: isLoadingSections } = useCollection(sectionsQuery);

  if (isUserLoading || isLoadingSections) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  // Create a map for quick lookup
  const sectionDataMap = new Map(pageSections?.map(s => [s.id, s]));

  // Create a sorted list of sections based on the config
  const sortedSections = sectionsConfig
    .map(config => sectionDataMap.get(config.id))
    .filter(Boolean); // Filter out any undefined if a section is in config but not DB

  return (
    <>
     {sortedSections.map((section: any, index) => (
        <PageSection
            key={section.id || index}
            pageId={pageId}
            sectionId={section.id}
            order={index}
        />
      ))}
    </>
  );
}

    