
"use client";

import { FeaturesSection } from "@/components/features-section";
import { ExclusiveFeatures } from "@/components/exclusive-features";
import { ComparisonSection } from "@/components/comparison-section";

export default function FeaturesPage() {
    return (
        <>
           <div className="py-16 sm:py-20 text-center">
                <div className="container mx-auto px-4">
                    <div className="relative w-full max-w-4xl mx-auto text-center mb-12">
                        <div className="absolute -top-12 -left-1/2 w-[200%] h-48 bg-primary/10 rounded-full blur-3xl -z-10" />
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter leading-tight bg-gradient-to-b from-primary to-accent text-transparent bg-clip-text">
                            Features
                        </h1>
                        <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">Everything you need for secure and private communication, from basic privacy to advanced developer tools.</p>
                    </div>
                </div>
            </div>
            <FeaturesSection />
            <div className="bg-muted/30">
                <ExclusiveFeatures />
            </div>
            <ComparisonSection removeBorder={true} />
        </>
    );
}
