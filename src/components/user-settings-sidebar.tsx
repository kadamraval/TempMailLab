
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const navItems = [
  { href: "/settings", label: "Profile" },
  { href: "/settings/account", label: "Account" },
  { href: "/settings/appearance", label: "Appearance" },
  { href: "/settings/notifications", label: "Notifications" },
];

export function UserSettingsSidebar() {
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
            {item.label}
          </Link>
        </Button>
      ))}
    </nav>
  );
}

    