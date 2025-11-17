
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

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
import { useUser } from "@/firebase/provider"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"

// A helper function to get a title from the path
const getTitleFromPath = (pathname: string): string => {
    if (pathname === '/dashboard') return 'Dashboard';
    const segment = pathname.split('/dashboard/')[1] || pathname.split('/settings')[1] || '';
    if (pathname.startsWith('/settings')) return 'Settings';

    const title = segment.split('/')[0].replace(/-/g, ' ');
    // Capitalize first letter of each word
    return title.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}


export function UserDashboardHeader() {
    const { user } = useUser();
    const pathname = usePathname();

    const getInitials = (email: string | null | undefined) => {
        if (!email) return "U";
        return email.charAt(0).toUpperCase();
    }

    return (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
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
                    <DropdownMenuItem asChild><Link href="/settings">Settings</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/">Support</Link></DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Logout</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}

    