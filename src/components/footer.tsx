
import Link from "next/link";
import { Separator } from "./ui/separator";

const topNavLinks = [
    { name: "Features", href: "/features" },
    { name: "Pricing", href: "/pricing" },
    { name: "Blog", href: "/blog" },
    { name: "API", href: "/api" },
    { name: "Extension", href: "/extension" },
    { name: "About", href: "/about" },
    { name: "Help Center", href: "/contact" },
];

const legalLinks = [
    { name: "Terms of Service", href: "/terms" },
    { name: "Privacy Policy", href: "/privacy" },
];

export function Footer() {
    return (
        <footer className="border-t bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-12">
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                 <nav className="flex gap-6">
                    {topNavLinks.map((link) => (
                         <Link key={link.name} href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                            {link.name}
                        </Link>
                    ))}
                 </nav>
            </div>
            
            <Separator className="my-8" />
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                     &copy; {new Date().getFullYear()} Tempmailoz. All rights reserved.
                </p>
                <div className="flex items-center gap-6">
                     {legalLinks.map((link) => (
                         <Link key={link.name} href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                            {link.name}
                        </Link>
                    ))}
                </div>
            </div>

        </div>
      </footer>
    )
}
