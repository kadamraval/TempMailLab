
"use client";

import { PageSection } from "@/components/page-section";

const pageId = "api-page";
const sections = ["top-title", "faq", "newsletter"];

export default function ApiPage() {
    return (
        <div className="py-16 sm:py-20">
            {sections.map((sectionId, index) => (
                <PageSection key={sectionId} pageId={pageId} sectionId={sectionId} order={index} />
            ))}
        </div>
    );
}
