
"use client"

import { PricingComparisonTable } from "./pricing-comparison-table";

export function ComparisonSection({ removeBorder }: { removeBorder?: boolean }) {
  return (
    <section id="comparison" className="py-16 sm:py-20">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
            Feature Comparison
          </h2>
        </div>
        <PricingComparisonTable removeBorder={removeBorder} />
      </div>
    </section>
  );
}
