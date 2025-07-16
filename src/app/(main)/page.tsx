import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { TempMailerClient } from "@/components/temp-mailer-client";
import { ShieldCheck, Zap, Globe, Check, Clock, Forward, Mail, Save } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { StayConnected } from "@/components/stay-connected";

const features = [
  {
    icon: <Clock className="w-8 h-8 text-primary" />,
    title: "Auto-Expiration",
    description: "Emails expire automatically after a set period with temp mail, ensuring your inbox is always clutter-free without any effort on your part.",
  },
  {
    icon: <Globe className="w-8 h-8 text-primary" />,
    title: "Custom Domain Support",
    description: "Enhance your brand identity with custom domain for temp mail, allowing you to create temporary emails using your own domain name.",
  },
  {
    icon: <Forward className="w-8 h-8 text-primary" />,
    title: "Email Forwarding",
    description: "Automatically forward your temp email to your primary email inbox, ensuring you never miss important messages while using our service.",
  },
  {
    icon: <Mail className="w-8 h-8 text-primary" />,
    title: "Instant Setup",
    description: "No lengthy sign-up processes. Generate a temp mail address with a single click and start using it instantly.",
  },
  {
    icon: <ShieldCheck className="w-8 h-8 text-primary" />,
    title: "Privacy Protection",
    description: "Your personal email stays secure and out of reach from spam and phishing attacks. We ensure your data is safe with temp mail.",
  },
  {
    icon: <Save className="w-8 h-8 text-primary" />,
    title: "Save for Later",
    description: "Not just for temporary use. You have the option to save your temp mail to your account for long-term use, making it versatile.",
  },
];

const faqItems = [
    {
        question: "What is a temporary email address?",
        answer: "A temporary email address is a disposable email that you can use for a short period to sign up for services without revealing your primary email address. This helps protect your real inbox from spam."
    },
    {
        question: "How long does a temporary email address last?",
        answer: "For our free service, the email address is active for 10 minutes. After that, it is permanently deleted and cannot be recovered. Premium users have options for longer-lasting addresses."
    },
    {
        question: "Is this service free?",
        answer: "Yes, the basic service of generating a temporary email is completely free. We also offer premium plans with additional features like custom domains, extended email lifetime, and API access."
    }
]

const plans = [
    {
        name: "Free",
        price: "$0",
        description: "For basic, quick use.",
        features: [
            "10-minute email lifetime",
            "Unlimited email generation",
            "Standard domains",
        ],
        cta: "Get Started",
        href: "/",
    },
    {
        name: "Pro",
        price: "$5",
        pricePeriod: "/ month",
        description: "For power users and developers.",
        features: [
            "Everything in Free, plus:",
            "Up to 24-hour email lifetime",
            "Use your own custom domains",
            "Consolidated inbox for all addresses",
            "API Access",
        ],
        cta: "Go Pro",
        href: "/register",
        featured: true,
    }
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background font-body">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <section className="text-center py-12">
            <div className="flex justify-center mb-4">
              <ShieldCheck className="w-16 h-16 text-yellow-500" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Your Private, Temporary Inbox</h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">Get a free, anonymous email address instantly. Protect your real inbox from spam, bots, and phishing attacks.</p>
        </section>

        <TempMailerClient />

        <section id="features" className="py-16 sm:py-24">
            <div className="text-center">
                <p className="font-semibold text-primary">FEATURES</p>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mt-2">Why Temp Mailer?</h2>
                <p className="mt-4 text-lg text-muted-foreground">Your go-to solution for private and temporary email.</p>
            </div>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {features.map((feature) => (
                    <div key={feature.title} className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm text-center">
                        <div className="inline-block bg-primary/10 p-3 rounded-full mb-4">{feature.icon}</div>
                        <h3 className="text-lg font-semibold">{feature.title}</h3>
                        <p className="mt-2 text-muted-foreground text-sm">{feature.description}</p>
                    </div>
                ))}
            </div>
        </section>

        <section id="pricing" className="py-16 sm:py-24 bg-muted/30 rounded-lg">
            <div className="text-center">
                 <p className="font-semibold text-primary">PRICING</p>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mt-2">Choose Your Plan</h2>
                <p className="mt-4 text-lg text-muted-foreground">Simple, transparent pricing for everyone.</p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-2 max-w-4xl mx-auto px-4">
                {plans.map((plan) => (
                    <Card key={plan.name} className={plan.featured ? "border-primary ring-2 ring-primary flex flex-col" : "flex flex-col"}>
                        <CardHeader>
                            <CardTitle>{plan.name}</CardTitle>
                            <CardDescription>{plan.description}</CardDescription>
                            <div className="flex items-baseline pt-4">
                                <span className="text-4xl font-bold">{plan.price}</span>
                                {plan.pricePeriod && <span className="text-muted-foreground">{plan.pricePeriod}</span>}
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <ul className="space-y-3">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start">
                                        <Check className="h-5 w-5 text-primary mr-2 mt-1 shrink-0" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button asChild className="w-full" variant={plan.featured ? "default" : "outline"}>
                                <Link href={plan.href}>{plan.cta}</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </section>

        <section id="faq" className="py-16 sm:py-24">
             <div className="text-center">
                <p className="font-semibold text-primary">FAQ</p>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mt-2">Questions? We have answers.</h2>
                <p className="mt-4 text-lg text-muted-foreground">Find answers to the most common questions about Temp Mailer.</p>
            </div>
            <div className="mt-12 max-w-3xl mx-auto">
                <Accordion type="single" collapsible>
                    {faqItems.map((item, index) => (
                        <AccordionItem value={`item-${index}`} key={index}>
                            <AccordionTrigger>{item.question}</AccordionTrigger>
                            <AccordionContent>{item.answer}</AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
                <div className="text-center mt-8">
                    <Button asChild variant="outline">
                        <Link href="/faq">View All FAQs</Link>
                    </Button>
                </div>
            </div>
        </section>

      </main>
      <StayConnected />
      <Footer />
    </div>
  );
}
