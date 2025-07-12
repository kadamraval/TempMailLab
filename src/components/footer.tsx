import Link from "next/link";

const footerLinks = {
    Company: [
        { name: "About", href: "/about" },
        { name: "Blog", href: "/blog" },
        { name: "Contact", href: "/contact" },
    ],
    Legal: [
        { name: "Privacy Policy", href: "/privacy" },
        { name: "Terms & Conditions", href: "/terms" },
        { name: "FAQ", href: "/faq" },
    ],
    Services: [
        { name: "Premium", href: "/premium" },
        { name: "API", href: "/api" },
        { name: "Advertising", href: "/advertising" },
    ],
}

export function Footer() {
    return (
        <footer className="border-t">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {Object.entries(footerLinks).map(([title, links]) => (
                <div key={title}>
                    <h3 className="font-semibold mb-4">{title}</h3>
                    <ul className="space-y-2">
                        {links.map((link) => (
                            <li key={link.name}>
                                <Link href={link.href} className="text-muted-foreground hover:text-foreground text-sm">
                                    {link.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
             <div>
                <h3 className="font-semibold mb-4">Admin Access</h3>
                 <p className="text-sm text-muted-foreground">For administrative use only.</p>
                 <Link href="/login/admin" className="text-sm underline text-primary hover:text-primary/80 mt-2 inline-block">
                    Admin Login
                 </Link>
            </div>
          </div>
          <div className="text-center mt-8 pt-8 border-t">
             <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} TempInbox. All rights reserved.</p>
          </div>
        </div>
      </footer>
    )
}
