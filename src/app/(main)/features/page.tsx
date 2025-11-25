"use client"

import { FeaturesSection } from "@/components/features-section";
import { ExclusiveFeatures } from "@/components/exclusive-features";
import { ComparisonSection } from "@/components/comparison-section";

export default function FeaturesPage() {
    return (
        <>
           <div className="py-16 sm:py-20 text-center">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
                    Features
                </h1>
                <p className="text-lg text-muted-foreground mt-4">Everything you need for secure and private communication.</p>
            </div>
            <FeaturesSection />
            <div className="bg-muted/30">
                <ExclusiveFeatures />
            </div>
            <ComparisonSection removeBorder={true} />
        </>
    );
}
