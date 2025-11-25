
"use client";

import { FeaturesSection } from "@/components/features-section";
import { ExclusiveFeatures } from "@/components/exclusive-features";
import { ComparisonSection } from "@/components/comparison-section";

export default function FeaturesPage() {
    const pageId = "features-page";
    return (
        <div className="space-y-16 sm:space-y-20 py-16 sm:py-20">
            <FeaturesSection pageId={pageId} sectionId="features" showTitle={false} />
            <ExclusiveFeatures pageId={pageId} sectionId="exclusive-features" />
            <ComparisonSection pageId={pageId} sectionId="comparison" removeBorder={true} />
        </div>
    );
}
