"use client";

import { PageSection } from "@/components/page-section";

const pageId = "features-page";
const sections = ["top-title", "features", "exclusive-features", "comparison", "faq", "newsletter"];

export default function FeaturesPage() {
    return (
        <>
            {sections.map((sectionId, index) => (
                <PageSection key={sectionId} pageId={pageId} sectionId={sectionId} order={index} />
            ))}
        </>
    );
}
