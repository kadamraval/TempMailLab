
import { SettingsSidebar } from "@/components/admin/settings-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SettingsLayoutProps {
  children: React.ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <Card>
        <CardHeader>
            <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent>
             <div className="grid md:grid-cols-[180px_1fr] gap-6">
                <aside>
                    <SettingsSidebar />
                </aside>
                <main>{children}</main>
            </div>
        </CardContent>
    </Card>
  )
}
