
import { UserSettingsSidebar } from "@/components/user-settings-sidebar";

export default function UserSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto px-4 py-8">
        <div className="space-y-0.5 mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
                Manage your account settings and set e-mail preferences.
            </p>
        </div>
        <div className="grid gap-8 md:grid-cols-[180px_1fr]">
            <aside>
                <UserSettingsSidebar />
            </aside>
            <main>{children}</main>
        </div>
    </div>
  );
}
