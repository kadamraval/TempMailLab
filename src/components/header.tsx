
"use client";

import Link from "next/link";
import { Mail, LogIn, LogOut, Star, LayoutDashboard } from "lucide-react";
import { Button } from "./ui/button";
import { useUser } from "@/firebase";
import { signOut } from "firebase/auth";
import { useAuth } from "@/firebase";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

const navLinks = [
    { href: "/", label: "Home" },
    { href: "/#features", label: "Features" },
    { href: "/faq", label: "FAQ" },
    { href: "/blog", label: "Blog" },
    { href: "/api", label: "API" },
];

export function Header() {
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      router.push("/");
    } catch (error) {
      toast({
        title: "Logout Failed",
        description: "An error occurred while logging out.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="border-b sticky top-0 bg-background z-50">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link href="/" className="flex items-center gap-2">
          <Mail className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Temp Mailer</h1>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                    {link.label}
                </Link>
            ))}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="outline">
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="outline">
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Link>
              </Button>
              <Button asChild variant="outline" className="text-yellow-500 border-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-400">
                <Link href="/premium">
                  <Star className="mr-2 h-4 w-4" />
                  Premium
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
