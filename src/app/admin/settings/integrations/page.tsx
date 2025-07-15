
"use client"

import * as React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Analytics, Briefcase, KeyRound, Mail, MessageSquare, Monitor, MousePointerClick, Zap } from "lucide-react";

// A simple placeholder for logos that are not in lucide-react
const SvgPlaceholder = ({ className }: { className?: string }) => (
    <div className={className}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-muted-foreground">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
        </svg>
    </div>
);

const integrations = [
    { 
        category: "Core", 
        title: "Firebase", 
        description: "Essential for user authentication, database, and backend functions.", 
        icon: <Zap className="h-8 w-8 text-yellow-500" /> 
    },
    { 
        category: "Marketing", 
        title: "MailChimp", 
        description: "Engage your audience with email marketing and automation.", 
        icon: <Mail className="h-8 w-8 text-amber-700" /> 
    },
    { 
        category: "Analytics", 
        title: "Google Analytics", 
        description: "Track website traffic and gain insights into user behavior.", 
        icon: <Analytics className="h-8 w-8 text-orange-500" /> 
    },
    { 
        category: "Analytics", 
        title: "Google Tag Manager", 
        description: "Manage and deploy marketing tags on your website without code changes.", 
        icon: <SvgPlaceholder />
    },
    { 
        category: "Payment", 
        title: "PayPal", 
        description: "Accept payments from customers worldwide with a trusted payment gateway.", 
        icon: <SvgPlaceholder />
    },
    { 
        category: "Payment", 
        title: "Stripe", 
        description: "A complete payment platform for online businesses of all sizes.", 
        icon: <Briefcase className="h-8 w-8 text-indigo-500" /> 
    },
    { 
        category: "Payment", 
        title: "Razorpay", 
        description: "Popular payment gateway for businesses in India.", 
        icon: <SvgPlaceholder />
    },
    { 
        category: "Support", 
        title: "Tawk.to", 
        description: "Add live chat to your website to engage with visitors in real-time.", 
        icon: <MessageSquare className="h-8 w-8 text-green-500" /> 
    },
    { 
        category: "Marketing", 
        title: "Google AdSense", 
        description: "Monetize your website by displaying targeted ads.", 
        icon: <MousePointerClick className="h-8 w-8 text-blue-500" /> 
    },
    { 
        category: "Authentication", 
        title: "Facebook Login", 
        description: "Allow users to sign in to your app with their Facebook account.", 
        icon: <SvgPlaceholder />
    },
    { 
        category: "Authentication", 
        title: "Google Login", 
        description: "Enable secure and easy sign-in with users' Google accounts.", 
        icon: <KeyRound className="h-8 w-8 text-red-500" /> 
    },
    { 
        category: "Security", 
        title: "reCAPTCHA", 
        description: "Protect your website from fraud and abuse with Google's CAPTCHA service.", 
        icon: <SvgPlaceholder />
    },
    { 
        category: "Core", 
        title: "Mail.tm", 
        description: "API for generating temporary email addresses, core to this application.", 
        icon: <Mail className="h-8 w-8 text-primary" />
    },
    { 
        category: "APIs", 
        title: "Cloud Billing API", 
        description: "Programmatically manage billing for your cloud projects.", 
        icon: <Monitor className="h-8 w-8 text-gray-500" /> 
    },
    { 
        category: "APIs", 
        title: "Cloud Monitoring API", 
        description: "Monitor the health and performance of your cloud infrastructure.", 
        icon: <Monitor className="h-8 w-8 text-gray-500" /> 
    }
];

const categories = ["All", ...new Set(integrations.map(i => i.category))];

export default function IntegrationsSettingsPage() {
    const [selectedCategory, setSelectedCategory] = React.useState("All");

    const filteredIntegrations = selectedCategory === "All"
        ? integrations
        : integrations.filter(i => i.category === selectedCategory);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Integrations</h2>
                    <p className="text-muted-foreground">
                        Connect and manage third-party services to extend your app's functionality.
                    </p>
                </div>
                <div className="w-full sm:w-auto">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Filter by category" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map(category => (
                                <SelectItem key={category} value={category}>{category}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredIntegrations.map((integration) => (
                    <Card key={integration.title} className="flex flex-col">
                        <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                            {integration.icon}
                            <div className="space-y-1">
                                <CardTitle>{integration.title}</CardTitle>
                                <CardDescription>{integration.description}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            {/* Content for configuration status can go here */}
                        </CardContent>
                        <CardFooter className="justify-between">
                            <Button variant="outline" size="sm" asChild>
                                <Link href="#">Details</Link>
                            </Button>
                            <Button size="sm">Configure</Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
