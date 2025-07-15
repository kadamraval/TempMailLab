"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const navItems = [
  { href: "/admin/settings/integrations", label: "Integrations" },
  { href: "/admin/settings/general", label: "General" },
  { href: "/admin/settings/appearance", label: "Appearance" },
];

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => (
        <Button
          key={item.href}
          asChild
          variant={pathname === item.href ? "secondary" : "ghost"}
          className="justify-start"
        >
          <Link href={item.href}>
            {item.label}
          </Link>
        </Button>
      ))}
    </nav>
  );
}
