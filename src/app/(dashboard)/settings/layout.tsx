import { UserSettingsSidebar } from "@/components/user-settings-sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";


export default function UserSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
     <Card>
        <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Manage your account settings and set e-mail preferences.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid gap-8 md:grid-cols-[180px_1fr]">
                <aside>
                    <UserSettingsSidebar />
                </aside>
                <main>{children}</main>
            </div>
        </CardContent>
     </Card>
  );
}
