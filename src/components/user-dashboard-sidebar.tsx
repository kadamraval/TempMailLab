"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Settings,
  CreditCard,
  Inbox,
  ChevronsLeft,
  LogOut,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import React from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/inbox", icon: Inbox, label: "Inbox" },
  { href: "/settings", icon: Settings, label: "Settings" },
  { href: "/billing", label: "Billing", icon: CreditCard },
];

interface UserDashboardSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

export function UserDashboardSidebar({ isCollapsed, setIsCollapsed }: UserDashboardSidebarProps) {
  const pathname = usePathname();

  const isLinkActive = (href: string) => {
    if (href === '/dashboard' && pathname === '/dashboard') return true;
    if (href !== '/dashboard' && pathname.startsWith(href)) return true;
    if (href === "/settings" && pathname.startsWith('/settings')) return true;
    return false;
  }

  const renderLink = (item: any) => {
    const isActive = isLinkActive(item.href);
    return (
        <Link
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
            isActive && "bg-muted text-primary",
            isCollapsed && "justify-center"
          )}
        >
          <item.icon className="h-4 w-4" />
          {!isCollapsed && <span>{item.label}</span>}
          {isCollapsed && <span className="sr-only">{item.label}</span>}
        </Link>
    )
  };


  return (
    <aside className={cn(
        "fixed inset-y-0 left-0 z-10 hidden flex-col border-r bg-background sm:flex transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
    )}>
       <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Inbox className="h-6 w-6 text-primary" />
          {!isCollapsed && <span>Temp Mailer</span>}
        </Link>
      </div>
       <ScrollArea className="flex-1 py-4">
        <TooltipProvider delayDuration={0}>
            <nav className="grid items-start px-4 text-sm font-medium">
            {navItems.map((item) =>
              isCollapsed ? (
                <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                        {renderLink(item)}
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
                ) : (
                    <React.Fragment key={item.href}>
                      {renderLink(item)}
                    </React.Fragment>
                )
            )}
            </nav>
        </TooltipProvider>
       </ScrollArea>
       <div className="mt-auto p-4 border-t">
        <div className="flex justify-between items-center">
            {!isCollapsed && (
                <Button size="sm" variant="outline" className="w-full justify-start" asChild>
                    <Link href="/">
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Link>
                </Button>
            )}
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={cn("h-8 w-8", isCollapsed && "mx-auto")}
            >
                <ChevronsLeft className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")} />
            </Button>
        </div>
      </div>
    </aside>
  );
}
