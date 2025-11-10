"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Zap, Lock, Forward } from "lucide-react";

const features = [
    {
        icon: <ShieldCheck className="w-8 h-8 text-primary" />,
        title: "Total Privacy",
        description: "Your temporary inboxes are completely private. We don't save your emails longer than the expiration time.",
    },
    {
        icon: <Zap className="w-8 h-8 text-primary" />,
        title: "Instant Setup",
        description: "Generate a new email address with a single click. No registration required for basic use.",
    },
    {
        icon: <Lock className="w-8 h-8 text-primary" />,
        title: "Spam Protection",
        description: "Keep your primary inbox clean. Use a temporary address for website sign-ups and newsletters.",
    },
    {
        icon: <Forward className="w-8 h-8 text-primary" />,
        title: "Email Forwarding",
        description: "Premium users can forward temporary emails to their real email address, keeping their primary address hidden.",
    },
];

export function FeaturesSection() {
    return (
        <section className="py-12 lg:py-24 bg-secondary">
            <div className="container mx-auto px-4">
                <div className="text-center space-y-3 mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Powerful Features for Your Privacy</h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Our service is packed with features designed to protect your identity and keep your main inbox clean.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <Card key={index} className="text-center shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
                            <CardHeader className="items-center">
                                <div className="bg-primary/10 p-3 rounded-full">
                                    {feature.icon}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                                <p className="text-muted-foreground">{feature.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
