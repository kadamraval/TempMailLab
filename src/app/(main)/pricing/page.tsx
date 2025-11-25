
"use client";

import { PageSection } from "@/components/page-section";

const pageId = "pricing-page";
const sections = ["pricing", "pricing-comparison"];

export default function PricingPage() {
    return (
        <div className="space-y-16 sm:space-y-20 py-16 sm:py-20">
            {sections.map((sectionId, index) => (
                <PageSection key={sectionId} pageId={pageId} sectionId={sectionId} order={index} />
            ))}
        </div>
    );
}

    