"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const plans = [
    {
        name: "Free",
        price: "$0",
        description: "For personal and occasional use.",
        features: [
            "1 Active Inbox",
            "10 Minute Inbox Lifetime",
            "Standard Domains",
            "Basic Spam Filtering",
        ],
        buttonText: "Get Started Free",
        href: "/",
    },
    {
        name: "Premium",
        price: "$5",
        priceCycle: "/ month",
        description: "For power users who need more.",
        features: [
            "Unlimited Inboxes",
            "24 Hour Inbox Lifetime",
            "Premium & Custom Domains",
            "Advanced Spam Filtering",
            "Email Forwarding",
            "No Ads",
            "Developer API Access",
        ],
        buttonText: "Go Premium",
        href: "/register",
        isPrimary: true,
    }
]

export function PricingSection() {
    return (
        <section id="pricing" className="py-16 sm:py-24">
            <div className="container mx-auto px-4">
                <div className="text-center space-y-4 mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Fair Pricing for Everyone</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-start">
                    {plans.map((plan) => (
                         <Card key={plan.name} className={cn(
                            "flex flex-col h-full shadow-sm hover:shadow-lg transition-shadow duration-200",
                            plan.isPrimary && "border-primary"
                         )}>
                             <div className="flex-grow">
                                <CardHeader className="pt-8">
                                    {plan.isPrimary && <div className="text-primary font-semibold mb-2">MOST POPULAR</div>}
                                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                    <CardDescription>{plan.description}</CardDescription>
                                    <div className="flex items-baseline pt-4">
                                        <span className="text-5xl font-bold tracking-tight">{plan.price}</span>
                                        {plan.priceCycle && <span className="text-muted-foreground ml-1">{plan.priceCycle}</span>}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-4">
                                        {plan.features.map((feature) => (
                                            <li key={feature} className="flex items-center gap-3">
                                                <Check className="w-5 h-5 text-green-500 shrink-0" />
                                                <span className="text-muted-foreground">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </div>
                            <CardFooter className="pb-8">
                                <Button asChild className="w-full" size="lg" variant={plan.isPrimary ? "default" : "outline"}>
                                    <Link href={plan.href}>{plan.buttonText}</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
