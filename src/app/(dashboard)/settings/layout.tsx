import { UserSettingsSidebar } from "@/components/user-settings-sidebar";
import { Card, CardContent } from "@/components/ui/card";


export default function UserSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
     <Card>
        <CardContent className="p-6">
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
