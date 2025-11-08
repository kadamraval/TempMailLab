import { DashboardClient } from "@/components/dashboard-client";

export default function DashboardPage() {
  // This page can be expanded to show user-specific dashboard information
  // For now, it will show the main email client.
  return (
    <main className="container mx-auto px-4 py-8">
      <DashboardClient />
    </main>
  );
}
