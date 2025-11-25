
"use client";

import { PageSection } from "@/components/page-section";

const pageId = "features-page";
const sections = ["features", "exclusive-features", "comparison"];

export default function FeaturesPage() {
    return (
        <div className="space-y-16 sm:space-y-20 py-16 sm:py-20">
            {sections.map((sectionId, index) => (
                <PageSection key={sectionId} pageId={pageId} sectionId={sectionId} order={index} />
            ))}
        </div>
    );
}

    