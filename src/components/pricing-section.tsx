
"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const plans = {
    monthly: [
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
    ],
    yearly: [
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
            price: "$48",
            priceCycle: "/ year",
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
}

export function PricingSection() {
    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

    const currentPlans = plans[billingCycle];

    return (
        <section id="pricing" className="py-16 sm:py-20">
            <div className="container mx-auto px-4">
                <div className="text-center space-y-4 mb-12">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">Fair Pricing</h2>
                </div>
                
                <div className="flex items-center justify-center space-x-4 mb-12">
                    <Label htmlFor="billing-cycle" className={cn("font-medium", billingCycle === "monthly" ? "text-primary" : "text-muted-foreground")}>Monthly</Label>
                    <Switch
                        id="billing-cycle"
                        checked={billingCycle === "yearly"}
                        onCheckedChange={(checked) => setBillingCycle(checked ? "yearly" : "monthly")}
                    />
                    <Label htmlFor="billing-cycle" className={cn("font-medium", billingCycle === "yearly" ? "text-primary" : "text-muted-foreground")}>
                        Yearly
                        <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Save 20%</span>
                    </Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-start">
                    {currentPlans.map((plan) => (
                         <Card key={plan.name} className={cn(
                            "flex flex-col h-full rounded-2xl",
                            plan.isPrimary && "border-2 border-primary shadow-2xl shadow-primary/20"
                         )}>
                             <CardHeader className="p-6">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                                    {plan.isPrimary && <div className="text-primary bg-primary/10 px-3 py-1 rounded-full text-sm font-semibold">POPULAR</div>}
                                </div>
                                <CardDescription className="pt-2">{plan.description}</CardDescription>
                                <div className="flex items-baseline pt-6">
                                    <span className="text-5xl font-bold tracking-tight">{plan.price}</span>
                                    {plan.priceCycle && <span className="text-muted-foreground ml-1">{plan.priceCycle}</span>}
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 flex-grow">
                                <ul className="space-y-4">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-center gap-3">
                                            <Check className="w-5 h-5 text-green-500 shrink-0" />
                                            <span className="text-muted-foreground">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter className="p-6 mt-auto">
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
