"use client";

import { FeaturesSection } from "@/components/features-section";
import { ExclusiveFeatures } from "@/components/exclusive-features";
import { ComparisonSection } from "@/components/comparison-section";

export default function FeaturesPage() {
    return (
        <div className="space-y-16 sm:space-y-20">
            <FeaturesSection showTitle={false} />
            <ExclusiveFeatures />
            <ComparisonSection removeBorder={true} />
        </div>
    );
}
