
"use client"

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { Plan } from "@/app/(admin)/admin/packages/data";

const planToDisplayPlan = (plan: Plan, cycle: 'monthly' | 'yearly') => {
    let price = plan.price;
    // Adjust price based on selected cycle vs plan's inherent cycle
    if (plan.cycle === 'monthly' && cycle === 'yearly') {
        price = price * 12 * 0.8; // Apply 20% discount for yearly
    } else if (plan.cycle === 'yearly' && cycle === 'monthly') {
        price = plan.price / 12 / 0.8; // Reverse discount to show monthly equivalent
    }

    return {
        id: plan.id,
        name: plan.name,
        price: cycle === 'monthly' ? (plan.cycle === 'yearly' ? plan.price / 12 : plan.price) : (plan.cycle === 'monthly' ? plan.price * 12 * 0.8 : plan.price),
        cycle: cycle,
        description: `For ${plan.name.toLowerCase()} users.`,
        features: {
            maxInboxes: plan.features.maxInboxes,
            inboxLifetime: plan.features.inboxLifetime,
            allowPremiumDomains: plan.features.allowPremiumDomains,
            noAds: plan.features.noAds,
            customDomains: plan.features.customDomains,
            apiAccess: plan.features.apiAccess
        },
        buttonText: plan.price > 0 ? `Go ${plan.name}` : 'Get Started',
        href: "/register",
        isPrimary: plan.name.toLowerCase() === 'premium'
    }
};

interface PricingSectionProps {
    plans?: Plan[];
    showTitle?: boolean;
}

export function PricingSection({ plans = [], showTitle = true }: PricingSectionProps) {
    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

    const currentPlans = React.useMemo(() => {
        return plans
            .map(p => planToDisplayPlan(p, billingCycle))
            .sort((a,b) => a.price - b.price);
    }, [plans, billingCycle]);

    const featureLabels: {[key: string]: (value: any) => string} = {
        maxInboxes: (v) => v > 0 ? `${v} Active Inbox${v > 1 ? 'es' : ''}` : 'Unlimited Inboxes',
        inboxLifetime: (v) => {
            if (v === 0) return 'Unlimited Inbox Lifetime';
            const hours = v/60;
            if (v >= 60) return `${Math.floor(hours)} ${Math.floor(hours) > 1 ? 'Hours' : 'Hour'} Inbox Lifetime`;
            return `${v} Minute Inbox Lifetime`;
        },
        allowPremiumDomains: (v) => v ? "Premium Domains" : "Standard Domains",
        noAds: (v) => v ? "No Ads" : "Ad-supported",
        customDomains: (v) => v > 0 ? `${v} Custom Domain${v > 1 ? 's' : ''}` : "No Custom Domains",
        apiAccess: (v) => v ? "Developer API Access" : "No API Access",
    }
    
    return (
        <section id="pricing">
            <div className="container mx-auto px-4">
                {showTitle && (
                    <div className="text-center space-y-4 mb-12">
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">Pricing</h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Choose the plan that's right for you, with options for everyone from casual users to professional developers.</p>
                    </div>
                )}
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

                {!plans || plans.length === 0 ? (
                    <div className="flex justify-center items-center h-64">
                         <p className="text-muted-foreground">No active plans available at the moment. Please check back later.</p>
                    </div>
                ): (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start max-w-5xl mx-auto">
                        {currentPlans.map((plan) => (
                             <Card key={plan.id} className={cn(
                                "flex flex-col h-full rounded-2xl border",
                                plan.isPrimary && "border-2 border-primary shadow-lg"
                             )}>
                                 <CardHeader className="p-6">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                                        {plan.isPrimary && <div className="text-primary bg-primary/10 px-3 py-1 rounded-full text-sm font-semibold">POPULAR</div>}
                                    </div>
                                    <CardDescription className="pt-2">{plan.description}</CardDescription>
                                    <div className="flex items-baseline pt-6">
                                        <span className="text-5xl font-bold tracking-tight">${plan.price > 0 ? plan.price.toFixed(2) : '0'}</span>
                                        {plan.price > 0 && <span className="text-muted-foreground ml-1">/ {plan.cycle === 'monthly' ? 'month' : 'year'}</span>}
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 flex-grow">
                                    <ul className="space-y-4">
                                        {Object.entries(plan.features).map(([key, value]) => {
                                            if (!featureLabels[key]) return null;
                                            return (
                                                <li key={key} className="flex items-center gap-3">
                                                    <Check className="w-5 h-5 text-green-500 shrink-0" />
                                                    <span className="text-muted-foreground">
                                                        {featureLabels[key](value)}
                                                    </span>
                                                </li>
                                            )
                                        })}
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
                )}
                 <div className="mt-12 text-center">
                    <Button asChild variant="ghost">
                        <Link href="/pricing">
                            Compare All Plans &rarr;
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
