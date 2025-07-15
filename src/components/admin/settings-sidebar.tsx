"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Share2, SlidersHorizontal, Palette } from "lucide-react"

const navItems = [
  { href: "/admin/settings/integrations", label: "Integrations", icon: Share2 },
  { href: "/admin/settings/general", label: "General", icon: SlidersHorizontal },
  { href: "/admin/settings/appearance", label: "Appearance", icon: Palette },
];

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <nav className="grid gap-1">
      {navItems.map((item) => (
        <Button
          key={item.href}
          asChild
          variant={pathname === item.href ? "secondary" : "ghost"}
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
