
import { AdminLayoutClient } from "@/components/admin/admin-layout-client";
import { getSession } from "@/lib/actions/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session?.isAdmin) {
    redirect('/client/login');
  }

  return (
    <AdminLayoutClient>
      {children}
    </AdminLayoutClient>
  );
}
