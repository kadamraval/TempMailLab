
import Link from "next/link";
import { Mail } from "lucide-react";

const footerLinks = {
    Company: [
        { name: "About", href: "/about" },
        { name: "Blog", href: "/blog" },
        { name: "Contact", href: "/contact" },
    ],
    Legal: [
        { name: "Privacy Policy", href: "/privacy" },
        { name: "Terms & Conditions", href: "/terms" },
    ],
    Services: [
        { name: "Pricing", href: "/#pricing" },
        { name: "API", href: "/api" },
        { name: "Features", href: "/#features" },
    ],
}

export function Footer() {
    return (
        <footer className="border-t bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
                <Link href="/" className="flex items-center gap-2">
                    <Mail className="h-6 w-6 text-primary" />
                    <h1 className="text-xl font-bold text-foreground">Temp Mailer</h1>
                </Link>
                <p className="mt-4 text-sm text-muted-foreground">Your secure and private temporary email solution.</p>
            </div>
            {Object.entries(footerLinks).map(([title, links]) => (
                <div key={title}>
                    <h3 className="font-semibold mb-4">{title}</h3>
                    <ul className="space-y-3">
                        {links.map((link) => (
                            <li key={link.name}>
                                <Link href={link.href} className="text-muted-foreground hover:text-primary text-sm transition-colors">
                                    {link.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
          </div>
          <div className="text-center mt-12 pt-8 border-t">
             <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Temp Mailer. All rights reserved.</p>
          </div>
        </div>
      </footer>
    )
}
