"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Globe,
  Inbox,
  CreditCard,
  Settings,
  LogOut,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const navItems = [
    { href: "/client/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/client/domain", icon: Globe, label: "Domains" },
    { href: "/client/inbox", icon: Inbox, label: "Inbox" },
    { href: "/client/billing", icon: CreditCard, label: "Billing" },
    { href: "/client/settings", icon: Settings, label: "Settings" },
]

export function ClientSidebar() {
    const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <TooltipProvider>
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
            {navItems.map((item) => (
            <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                <Link
                    href={item.href}
                    className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                        pathname === item.href && "bg-accent text-accent-foreground"
                    )}
                >
                    <item.icon className="h-5 w-5" />
                    <span className="sr-only">{item.label}</span>
                </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
            ))}
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
            <Tooltip>
            <TooltipTrigger asChild>
                <Link
                href="/"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                >
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Logout</span>
                </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Logout</TooltipContent>
            </Tooltip>
        </nav>
      </TooltipProvider>
    </aside>
  )
}
