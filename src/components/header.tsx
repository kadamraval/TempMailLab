
"use client";

import Link from "next/link";
import { Mail, LogIn, LogOut, LayoutDashboard, Settings } from "lucide-react";
import { Button } from "./ui/button";
import { useUser, useAuth } from "@/firebase/provider";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ModeToggle } from "./mode-toggle";


const navLinks = [
    { href: "/#features", label: "Features" },
    { href: "/extension", label: "Extension" },
    { href: "/#pricing", label: "Pricing" },
    { href: "/#faq", label: "FAQ" },
];

export function Header() {
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      if(auth) {
        await signOut(auth);
        toast({
          title: "Logged Out",
          description: "You have been successfully logged out.",
        });
        router.push("/");
      }
    } catch (error) {
      toast({
        title: "Logout Failed",
        description: "An error occurred while logging out.",
        variant: "destructive",
      });
    }
  };

  const getInitials = (email: string | null | undefined) => {
    if (!email) return "?";
    return email.charAt(0).toUpperCase();
  }

  return (
    <header className="border-b sticky top-0 bg-background/80 backdrop-blur-sm z-50">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link href="/" className="flex items-center gap-2">
          <Mail className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Temp Mailer</h1>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                    {link.label}
                </Link>
            ))}
        </nav>
        <div className="flex items-center gap-2">
          {user && !user.isAnonymous ? (
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={user.photoURL || ''} alt={user.email || 'User'} />
                        <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                    </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.displayName || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                   <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                   <LogOut className="mr-2 h-4 w-4" />
                   <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild>
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Link>
            </Button>
          )}
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}

    