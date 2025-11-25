
"use client";

import { PageSection } from "@/components/page-section";

const pageId = "contact";
const sections = ["top-title", "contact-form", "faq"];


export default function ContactPage() {
  return (
    <div className="py-16 sm:py-20">
       <div className="container mx-auto px-4">
            {sections.map((sectionId, index) => (
                <PageSection key={sectionId} pageId={pageId} sectionId={sectionId} order={index} />
            ))}
        </div>
    </div>
  );
}
