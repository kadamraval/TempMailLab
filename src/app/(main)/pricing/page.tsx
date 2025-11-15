"use client";

import { PricingSection } from "@/components/pricing-section";
import { PricingComparisonTable } from "@/components/pricing-comparison-table";

export default function PricingPage() {
  return (
    <>
      <PricingSection />
      <div className="border-t">
        <PricingComparisonTable />
      </div>
    </>
  );
}
