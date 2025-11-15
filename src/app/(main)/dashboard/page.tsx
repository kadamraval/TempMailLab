"use client";

import { DashboardClient } from "@/components/dashboard-client";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { type Plan } from "@/app/(admin)/admin/packages/data";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const { user, isUserLoading: isUserAuthLoading } = useUser();
  const firestore = useFirestore();

  // Get the user's specific plan ID from their user document (assuming it's stored there)
  // This is a placeholder for how you might get the user's plan.
  // For now, we'll assume anonymous users are 'default' and logged in are 'premium' for demo.
  const planId = user && !user.isAnonymous ? "premium" : "default";

  const planRef = useMemoFirebase(() => {
    if (!firestore || !planId) return null;
    // This is a simplification. In a real app, you'd get the user's actual plan ID.
    // Let's assume we have a plan with the id 'premium' and 'default'
    if (planId === 'premium') {
        // In a real app you would look up the actual premium plan id
        // for now we find it by name.
        return null; // This will be handled in DashboardClient
    }
    return doc(firestore, 'plans', 'default');
  }, [firestore, planId]);

  const { data: plan, isLoading: isPlanLoading } = useDoc<Plan>(planRef);

   if (isUserAuthLoading || isPlanLoading && planId !== 'premium') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  // If a logged-in user has no specific plan, they get the default plan.
  const userPlan = plan;

  return (
    <main className="container mx-auto px-4 py-8">
       {userPlan ? (
         <DashboardClient userPlan={userPlan} />
       ) : (
         <div className="py-16 sm:py-20">
            <DashboardClient />
         </div>
       )}
    </main>
  );
}
