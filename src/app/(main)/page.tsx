
"use client";

import { useUser } from "@/firebase/auth/use-user";
import { Loader2 } from "lucide-react";
import { PageSection } from "@/components/page-section";

const pageId = "home";

// Defines the static order and IDs of sections to be rendered on the homepage.
// Each PageSection component will be responsible for fetching its own data.
const sectionsConfig = [
    { id: "top-title" },
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

  // Show a loader while the initial user authentication is in progress.
  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Render the list of sections in the order defined in the config.
  return (
    <>
     {sectionsConfig.map((section, index) => (
        <PageSection
            key={section.id}
            pageId={pageId}
            sectionId={section.id}
            order={index}
        />
      ))}
    </>
  );
}
