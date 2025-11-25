
"use client";

import { PageSection } from "@/components/page-section";

const pageId = "pricing-page";
const sections = ["top-title", "pricing", "pricing-comparison", "faq", "newsletter"];

export default function PricingPage() {
    return (
        <div className="py-16 sm:py-20">
            {sections.map((sectionId, index) => (
                <PageSection key={sectionId} pageId={pageId} sectionId={sectionId} order={index} />
            ))}
        </div>
    );
}
