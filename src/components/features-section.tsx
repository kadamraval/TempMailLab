
"use client"

import { ShieldCheck, Zap, Lock, Forward, Server, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";

const features = [
    {
        icon: <ShieldCheck className="w-8 h-8 text-primary" />,
        title: "Total Privacy",
        description: "Your temporary inboxes are completely private and secure. Emails are deleted after expiration.",
    },
    {
        icon: <Zap className="w-8 h-8 text-primary" />,
        title: "Instant Setup",
        description: "Generate a new email address with a single click. No registration required for basic use.",
    },
    {
        icon: <Lock className="w-8 h-8 text-primary" />,
        title: "Spam Protection",
        description: "Keep your primary inbox clean. Use a temp address for website sign-ups and marketing lists.",
    },
    {
        icon: <Forward className="w-8 h-8 text-primary" />,
        title: "Email Forwarding",
        description: "Premium users can forward temp emails to their real address, keeping their primary address hidden.",
    },
    {
        icon: <Server className="w-8 h-8 text-primary" />,
        title: "Custom Domains",
        description: "Power users can connect their own domains to generate unique, branded temp email addresses.",
    },
    {
        icon: <Users className="w-8 h-8 text-primary" />,
        title: "Developer API",
        description: "Integrate our temp email service into your own applications with our simple and powerful API.",
    },
];

export function FeaturesSection() {
    return (
        <section id="features" className="py-16 sm:py-24 bg-muted/30">
            <div className="container mx-auto px-4">
                <div className="text-center space-y-4 mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                        Features
                    </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-4">
                             <div className="flex-shrink-0 p-3 bg-primary/10 rounded-full">
                                {React.cloneElement(feature.icon, { className: "w-6 h-6 text-primary"})}
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                                <p className="text-muted-foreground">{feature.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
