
import { PricingSection } from "@/components/pricing-section";
import { PricingComparisonTable } from "@/components/pricing-comparison-table";
import { collection, query, where, getDocs } from "firebase/firestore";
import type { Plan } from "@/app/(admin)/admin/packages/data";
import { initializeFirebase } from "@/firebase/index.server";

// Fetch data on the server
async function getActivePlans() {
  const { firestore } = initializeFirebase();
  const plansQuery = query(
      collection(firestore, "plans"), 
      where("status", "==", "active")
  );
  
  const querySnapshot = await getDocs(plansQuery);
  const plans = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Plan[];
  return plans;
}

// This is now a Server Component
export default async function PricingPage() {
  const plans = await getActivePlans();
  
  // Exclude the 'Default' plan from the user-facing pricing page
  const displayPlans = plans?.filter(plan => plan.name !== 'Default') || [];

  return (
    <>
      {/* We pass the server-fetched plans directly to the client components */}
      <PricingSection plans={displayPlans} />
      <div className="border-t">
        <PricingComparisonTable plans={displayPlans} />
      </div>
    </>
  );
}
