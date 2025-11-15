
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Package2,
  Bell,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ModeToggle } from "./mode-toggle"
import { useUser } from "@/firebase"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"

// A helper function to get a title from the path
const getTitleFromPath = (pathname: string): string => {
    if (pathname === '/admin') return 'Dashboard';
    const segment = pathname.split('/admin/')[1] || '';
    const title = segment.split('/')[0];
    return title.charAt(0).toUpperCase() + title.slice(1).replace(/-/g, ' ');
}


export function AdminHeader() {
    const { user } = useUser();
    const pathname = usePathname();

    const getInitials = (email: string | null | undefined) => {
        if (!email) return "U";
        return email.charAt(0).toUpperCase();
    }

    return (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
             <div className="flex-1">
                 <h1 className="text-xl font-semibold">{getTitleFromPath(pathname)}</h1>
            </div>

            <div className="flex items-center gap-2">
                <ModeToggle />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        className="overflow-hidden rounded-full"
                    >
                         <Avatar className="h-8 w-8">
                            <AvatarImage src={user?.photoURL || ''} alt={user?.email || 'User'} />
                            <AvatarFallback>{getInitials(user?.email)}</AvatarFallback>
                        </Avatar>
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Settings</DropdownMenuItem>
                    <DropdownMenuItem>Support</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Logout</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
