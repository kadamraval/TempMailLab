
"use client";

import { FeaturesSection } from "@/components/features-section";
import { ExclusiveFeatures } from "@/components/exclusive-features";
import { ComparisonSection } from "@/components/comparison-section";

export default function FeaturesPage() {
    return (
        <div className="py-16 sm:py-20">
            <FeaturesSection />
            <div className="bg-muted/30">
                <ExclusiveFeatures />
            </div>
            <ComparisonSection removeBorder={true} />
        </div>
    );
}
