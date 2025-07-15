"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Users,
  Package,
  Ticket,
  Megaphone,
  Settings,
  LogOut,
  Globe,
  Inbox,
  DollarSign,
  ShoppingCart,
  Headset,
  FileText,
  BookOpen,
  LayoutGrid,
  Library,
  ChevronDown,
  ChevronRight,
  Code,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible"
import React from "react"
import { Button } from "./ui/button"


const navItems = [
    { href: "/admin/dashboard", icon: Home, label: "Dashboard" },
    { href: "/admin/domain", icon: Globe, label: "Domain" },
    { href: "/admin/inbox", icon: Inbox, label: "Inbox" },
    { href: "/admin/users", icon: Users, label: "Users" },
    {
      label: "Sales",
      icon: DollarSign,
      subItems: [
        { href: "/admin/plans", icon: Package, label: "Plans" },
        { href: "/admin/coupons", icon: Ticket, label: "Coupons" },
        { href: "/admin/ads", icon: Megaphone, label: "Ads" },
        { href: "/admin/billing", icon: ShoppingCart, label: "Billing" },
      ]
    },
    { href: "/admin/marketing", icon: Megaphone, label: "Marketing" },
    { href: "/admin/support", icon: Headset, label: "Support" },
    {
      label: "Pages",
      icon: FileText,
      subItems: [
        { href: "/admin/pages", icon: FileText, label: "All Pages" },
        { href: "/admin/sections", icon: LayoutGrid, label: "Sections" },
        { href: "/admin/blog", icon: BookOpen, label: "All Blog" },
        { href: "/admin/categories", icon: Library, label: "Category" },
      ]
    },
    { href: "/admin/settings", icon: Settings, label: "Settings" },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Inbox className="h-6 w-6 text-primary" />
          <span>TempInbox</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-auto py-4">
        <div className="grid items-start px-4 text-sm font-medium">
          {navItems.map((item) =>
            item.subItems ? (
              <Collapsible key={item.label} className="grid gap-1">
                <CollapsibleTrigger className="flex items-center justify-between rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary [&[data-state=open]>svg]:rotate-90">
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </div>
                  <ChevronRight className="h-4 w-4 transition-transform" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-7">
                  <div className="grid gap-1">
                  {item.subItems.map((subItem) => (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                        pathname.startsWith(subItem.href) && "bg-muted text-primary"
                      )}
                    >
                      <subItem.icon className="h-4 w-4" />
                      {subItem.label}
                    </Link>
                  ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <Link
                key={item.href}
                href={item.href!}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  pathname === item.href && "bg-muted text-primary"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          )}
        </div>
      </nav>
      <div className="mt-auto p-4 border-t">
         <Button size="sm" variant="outline" className="w-full justify-start" asChild>
          <Link href="/">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Link>
        </Button>
      </div>
    </aside>
  );
}
