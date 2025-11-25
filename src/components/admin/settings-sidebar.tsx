
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SlidersHorizontal, Palette, FileText, Mail, Share2, DollarSign, Code, Clock, Database, Wrench, HardDrive, Cloud, Server, LayoutGrid } from "lucide-react"

const navItems = [
  { href: "/admin/settings/general", label: "General", icon: SlidersHorizontal },
  { href: "/admin/settings/appearance", label: "Appearance", icon: Palette },
  { href: "/admin/pages", label: "Pages", icon: FileText },
  { href: "/admin/sections", label: "Default Sections", icon: LayoutGrid },
  { href: "/admin/settings/email", label: "Email", icon: Mail },
  { href: "/admin/settings/integrations", label: "Integrations", icon: Share2 },
  { href: "/admin/settings/sales", label: "Sales", icon: DollarSign },
  { href: "/admin/settings/api", label: "API", icon: Code },
  { href: "/admin/settings/cronjob", label: "Cronjob", icon: Clock },
  { href: "/admin/settings/cache", label: "Cache", icon: Database },
  { href: "/admin/settings/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/admin/settings/system", label: "System", icon: HardDrive },
  { href: "/admin/settings/environment", label: "Environment", icon: Server },
  { href: "/admin/settings/cloud-console", label: "Cloud Console", icon: Cloud },
];

export function SettingsSidebar() {
  const pathname = usePathname();

  const isLinkActive = (href: string) => {
    if (href === "/admin/settings/general" && pathname === "/admin/settings") return true;
    if (pathname.startsWith(href)) return true;
    return false;
  }

  return (
    <nav className="grid gap-1">
      {navItems.map((item) => (
        <Button
          key={item.href}
          asChild
          variant={isLinkActive(item.href) ? "secondary" : "ghost"}
          className="justify-start"
        >
          <Link href={item.href}>
            <item.icon className="mr-2 h-4 w-4" />
            {item.label}
          </Link>
        </Button>
      ))}
    </nav>
  );
}
