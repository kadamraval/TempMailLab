import Link from "next/link";
import { Mail, LogIn, Star } from "lucide-react";
import { Button } from "./ui/button";

const navLinks = [
    { href: "/", label: "Home" },
    { href: "/#features", label: "Features" },
    { href: "/faq", label: "FAQ" },
    { href: "/blog", label: "Blog" },
    { href: "/api", label: "API" },
]

export function Header() {
  return (
    <header className="border-b sticky top-0 bg-background z-50">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link href="/" className="flex items-center gap-2">
          <Mail className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">TempInbox</h1>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                    {link.label}
                </Link>
            ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/login">
              <LogIn className="mr-2 h-4 w-4" />
              Login
            </Link>
          </Button>
          <Button asChild variant="default">
            <Link href="/premium">
              <Star className="mr-2 h-4 w-4" />
              Premium
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
