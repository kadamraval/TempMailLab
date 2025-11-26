"use client";

import { PageSection } from "@/components/page-section";

const pageId = "contact";
const sections = ["top-title", "contact-form", "faq"];


export default function ContactPage() {
  return (
    <>
        {sections.map((sectionId, index) => (
            <PageSection key={sectionId} pageId={pageId} sectionId={sectionId} order={index} />
        ))}
    </>
  );
}
