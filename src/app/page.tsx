import { Header } from "@/components/header";
import { TempInboxClient } from "@/components/temp-inbox-client";
import { CheckCircle, ShieldCheck, Zap, Globe } from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: <ShieldCheck className="w-8 h-8 text-primary" />,
    title: "Privacy Focused",
    description: "Keep your real inbox clean and secure from spam and phishing.",
  },
  {
    icon: <Zap className="w-8 h-8 text-primary" />,
    title: "Instant Setup",
    description: "Generate a new temporary email address with a single click. No registration required.",
  },
  {
    icon: <Globe className="w-8 h-8 text-primary" />,
    title: "Multiple Domains",
    description: "Choose from a variety of domains to generate your temporary email.",
  },
  {
    icon: <CheckCircle className="w-8 h-8 text-primary" />,
    title: "Easy to Use",
    description: "A simple and intuitive interface to manage your temporary inbox.",
  },
];

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

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background font-body">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <TempInboxClient />

        <section id="features" className="py-16 sm:py-24">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Why TempInbox?</h2>
                <p className="mt-4 text-lg text-muted-foreground">Your go-to solution for private and temporary email.</p>
            </div>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {features.map((feature) => (
                    <div key={feature.title} className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
                        <div className="mb-4">{feature.icon}</div>
                        <h3 className="text-lg font-semibold">{feature.title}</h3>
                        <p className="mt-2 text-muted-foreground">{feature.description}</p>
                    </div>
                ))}
            </div>
        </section>

      </main>
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
    </div>
  );
}