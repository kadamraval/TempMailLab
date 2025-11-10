
"use client"

import { ShieldCheck, Zap, Lock, Forward, Server, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const features = [
    {
        icon: <ShieldCheck className="w-8 h-8 text-primary" />,
        title: "Total Privacy",
        description: "Your temporary inboxes are completely private. We don't save your emails longer than the expiration time.",
    },
    {
        icon: <Zap className="w-8 h-8 text-green-500" />,
        title: "Instant Setup",
        description: "Generate a new email address with a single click. No registration required for basic use.",
    },
    {
        icon: <Lock className="w-8 h-8 text-red-500" />,
        title: "Spam Protection",
        description: "Keep your primary inbox clean. Use a temporary address for website sign-ups and newsletters.",
    },
    {
        icon: <Forward className="w-8 h-8 text-yellow-500" />,
        title: "Email Forwarding",
        description: "Premium users can forward temporary emails to their real email address, keeping their primary address hidden.",
    },
    {
        icon: <Server className="w-8 h-8 text-purple-500" />,
        title: "Custom Domains",
        description: "Power users can connect their own domains to generate unique, branded temporary email addresses.",
    },
    {
        icon: <Users className="w-8 h-8 text-orange-500" />,
        title: "Developer API",
        description: "Integrate our temporary email service into your own applications with our simple and powerful API.",
    },
];

export function FeaturesSection() {
    return (
        <section id="features" className="py-12 lg:py-24 bg-secondary">
            <div className="container mx-auto px-4">
                <div className="text-center space-y-3 mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Features</h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Everything you need to protect your online identity and keep your main inbox clean.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <Card key={index} className="text-center shadow-sm hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="p-4 bg-muted rounded-full inline-block mb-4">
                                    {feature.icon}
                                </div>
                                <CardTitle>{feature.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{feature.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
