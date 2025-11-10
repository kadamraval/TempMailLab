"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import Link from "next/link";

const plans = [
    {
        name: "Free",
        price: "$0",
        description: "For personal and occasional use. Get started instantly.",
        features: [
            "1 Active Inbox",
            "10 Minute Inbox Lifetime",
            "Standard Domains",
            "Basic Spam Filtering",
        ],
        buttonText: "Get Started",
        href: "/",
    },
    {
        name: "Premium",
        price: "$5",
        priceCycle: "/ month",
        description: "For power users who need more features and control.",
        features: [
            "Unlimited Inboxes",
            "24 Hour Inbox Lifetime",
            "Premium & Custom Domains",
            "Advanced Spam Filtering",
            "Email Forwarding",
            "No Ads",
            "API Access",
        ],
        buttonText: "Go Premium",
        href: "/register",
        isPrimary: true,
    }
]

export function PricingSection() {
    return (
        <section className="py-12 lg:py-24">
            <div className="container mx-auto px-4">
                <div className="text-center space-y-3 mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Flexible Plans for Everyone</h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Whether you need a quick temporary email or advanced features, we have a plan that's right for you.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {plans.map((plan) => (
                        <Card key={plan.name} className={`flex flex-col ${plan.isPrimary ? 'border-primary shadow-primary/20' : ''}`}>
                            <CardHeader>
                                <CardTitle>{plan.name}</CardTitle>
                                <CardDescription>{plan.description}</CardDescription>
                                <div className="flex items-baseline pt-4">
                                    <span className="text-4xl font-bold">{plan.price}</span>
                                    {plan.priceCycle && <span className="text-muted-foreground">{plan.priceCycle}</span>}
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <ul className="space-y-3">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-center gap-3">
                                            <Check className="w-5 h-5 text-green-500" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button asChild className="w-full" variant={plan.isPrimary ? "default" : "outline"}>
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
