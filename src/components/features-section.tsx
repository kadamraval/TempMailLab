"use client"

import { ShieldCheck, Zap, Lock, Forward, Server, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
    {
        icon: <ShieldCheck className="w-8 h-8 text-foreground" />,
        title: "Total Privacy",
        description: "Your temporary inboxes are completely private. We don't save your emails longer than the expiration time.",
        color: "bg-chart-1",
    },
    {
        icon: <Zap className="w-8 h-8 text-foreground" />,
        title: "Instant Setup",
        description: "Generate a new email address with a single click. No registration required for basic use.",
        color: "bg-chart-2",
    },
    {
        icon: <Lock className="w-8 h-8 text-foreground" />,
        title: "Spam Protection",
        description: "Keep your primary inbox clean. Use a temporary address for website sign-ups and newsletters.",
        color: "bg-chart-3",
    },
    {
        icon: <Forward className="w-8 h-8 text-foreground" />,
        title: "Email Forwarding",
        description: "Premium users can forward temporary emails to their real email address, keeping their primary address hidden.",
         color: "bg-primary",
    },
    {
        icon: <Server className="w-8 h-8 text-foreground" />,
        title: "Custom Domains",
        description: "Power users can connect their own domains to generate unique, branded temporary email addresses.",
        color: "bg-chart-4",
    },
    {
        icon: <Users className="w-8 h-8 text-foreground" />,
        title: "Developer API",
        description: "Integrate our temporary email service into your own applications with our simple and powerful API.",
        color: "bg-chart-5",
    },
];

export function FeaturesSection() {
    return (
        <section id="features" className="py-12 lg:py-24 bg-secondary">
            <div className="container mx-auto px-4">
                <div className="text-center space-y-3 mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Features</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div key={index} className="bg-card border-2 border-foreground p-1 rounded-lg relative group">
                            <div className="absolute -bottom-2 -right-2 -z-10 h-full w-full rounded-md bg-foreground" />
                            <div className="relative z-10 bg-card p-6 rounded-md h-full text-center">
                                <div className={cn("p-3 rounded-md inline-block mb-4 border-2 border-foreground", feature.color)}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                                <p className="text-muted-foreground">{feature.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
