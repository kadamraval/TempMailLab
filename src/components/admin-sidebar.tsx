
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
  ChevronRight,
  ChevronsLeft,
  Shield,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import React from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

const navItems = [
    { href: "/admin", icon: Home, label: "Dashboard" },
    { 
      label: "Domain", 
      icon: Globe, 
      href: "/admin/domain",
    },
    { href: "/admin/inbox", icon: Inbox, label: "Inbox" },
    { href: "/admin/users", icon: Users, label: "Users" },
    {
      label: "Sales",
      icon: DollarSign,
      subItems: [
        { href: "/admin/packages", icon: Package, label: "Plans" },
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
];

interface AdminSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

export function AdminSidebar({ isCollapsed, setIsCollapsed }: AdminSidebarProps) {
  const pathname = usePathname();

  const isLinkActive = (item: any) => {
    if (item.href === '/admin' && pathname === '/admin') return true;
    if (item.href !== '/admin' && pathname.startsWith(item.href)) return true;
    if (item.label === "Settings" && pathname.startsWith('/admin/settings')) return true;
    if (item.label === "Domain" && pathname.startsWith('/admin/domain')) return true;
    return false;
  }

  const renderLink = (item: any, isSubItem = false) => {
    const isActive = isLinkActive(item);
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

  const renderCollapsible = (item: any) => {
    const isActive = item.subItems.some((sub: any) => pathname.startsWith(sub.href)) || pathname.startsWith(item.href || '---');
    return (
    <Collapsible key={item.label} className="grid gap-1" defaultOpen={isActive}>
      <CollapsibleTrigger asChild>
          <button className={cn(
            "flex items-center w-full gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary [&[data-state=open]>svg:last-child]:rotate-90",
            isActive && "text-primary",
            isCollapsed && "justify-center"
            )}>
            <item.icon className="h-4 w-4" />
            {!isCollapsed && <span>{item.label}</span>}
            {!isCollapsed && <ChevronRight className="ml-auto h-4 w-4 transition-transform" />}
          </button>
      </CollapsibleTrigger>
      <CollapsibleContent className={cn("pl-7", isCollapsed && "pl-0")}>
        <div className="grid gap-1">
          {item.subItems.map((subItem: any) =>
            isCollapsed ? (
              <Tooltip key={subItem.href}>
                <TooltipTrigger asChild>{renderLink(subItem, true)}</TooltipTrigger>
                <TooltipContent side="right">{subItem.label}</TooltipContent>
              </Tooltip>
            ) : (
              <React.Fragment key={subItem.href}>
                {renderLink(subItem, true)}
              </React.Fragment>
            )
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )};

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
                item.subItems ? (
                    <React.Fragment key={item.label}>
                      {renderCollapsible(item)}
                    </React.Fragment>
                ) : isCollapsed ? (
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
