import { SettingsSidebar } from "@/components/admin/settings-sidebar";

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="grid md:grid-cols-[180px_1fr] lg:grid-cols-[200px_1fr] gap-6">
      <SettingsSidebar />
      <div>
        {children}
      </div>
    </div>
  );
}
