
"use client"

import * as React from "react"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Briefcase, KeyRound, Mail, MessageSquare, Monitor, MousePointerClick, Zap, Tags } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SvgPlaceholder = ({ className }: { className?: string }) => (
    <div className={className}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-muted-foreground">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
        </svg>
    </div>
);

const integrations = [
    { 
        slug: "firebase",
        category: "Core", 
        title: "Firebase", 
        description: "Essential for user authentication, database, and backend functions.", 
        icon: <Zap className="h-6 w-6 text-yellow-500" />,
        configured: true,
    },
    { 
        slug: "mailchimp",
        category: "Marketing", 
        title: "MailChimp", 
        description: "Engage your audience with email marketing and automation.", 
        icon: <Mail className="h-6 w-6 text-amber-700" />,
        configured: false,
    },
    { 
        slug: "google-analytics",
        category: "Analytics", 
        title: "Google Analytics", 
        description: "Track website traffic and gain insights into user behavior.", 
        icon: <BarChart className="h-6 w-6 text-orange-500" />,
        configured: true,
    },
    { 
        slug: "google-tag-manager",
        category: "Analytics", 
        title: "Google Tag Manager", 
        description: "Manage and deploy marketing tags on your website without code changes.", 
        icon: <Tags className="h-6 w-6 text-blue-400" />,
        configured: false,
    },
    { 
        slug: "paypal",
        category: "Payment", 
        title: "PayPal", 
        description: "Accept payments from customers worldwide with a trusted payment gateway.", 
        icon: <SvgPlaceholder />,
        configured: false,
    },
    { 
        slug: "stripe",
        category: "Payment", 
        title: "Stripe", 
        description: "A complete payment platform for online businesses of all sizes.", 
        icon: <Briefcase className="h-6 w-6 text-indigo-500" />,
        configured: true,
    },
    { 
        slug: "razorpay",
        category: "Payment", 
        title: "Razorpay", 
        description: "Popular payment gateway for businesses in India.", 
        icon: <SvgPlaceholder />,
        configured: false,
    },
    { 
        slug: "tawkto",
        category: "Support", 
        title: "Tawk.to", 
        description: "Add live chat to your website to engage with visitors in real-time.", 
        icon: <MessageSquare className="h-6 w-6 text-green-500" />,
        configured: false,
    },
    { 
        slug: "google-adsense",
        category: "Marketing", 
        title: "Google AdSense", 
        description: "Monetize your website by displaying targeted ads.", 
        icon: <MousePointerClick className="h-6 w-6 text-blue-500" />,
        configured: true,
    },
    { 
        slug: "facebook-login",
        category: "Authentication", 
        title: "Facebook Login", 
        description: "Allow users to sign in to your app with their Facebook account.", 
        icon: <SvgPlaceholder />,
        configured: false,
    },
    { 
        slug: "google-login",
        category: "Authentication", 
        title: "Google Login", 
        description: "Enable secure and easy sign-in with users' Google accounts.", 
        icon: <KeyRound className="h-6 w-6 text-red-500" />,
        configured: true,
    },
    { 
        slug: "recaptcha",
        category: "Security", 
        title: "reCAPTCHA", 
        description: "Protect your website from fraud and abuse with Google's CAPTCHA service.", 
        icon: <SvgPlaceholder />,
        configured: false,
    },
    { 
        slug: "mail-tm",
        category: "Core", 
        title: "Mail.tm", 
        description: "API for generating temporary email addresses, core to this application.", 
        icon: <Mail className="h-6 w-6 text-primary" />,
        configured: true,
    },
    { 
        slug: "cloud-billing-api",
        category: "APIs", 
        title: "Cloud Billing API", 
        description: "Programmatically manage billing for your cloud projects.", 
        icon: <Monitor className="h-6 w-6 text-gray-500" />,
        configured: false,
    },
    { 
        slug: "cloud-monitoring-api",
        category: "APIs", 
        title: "Cloud Monitoring API", 
        description: "Monitor the health and performance of your cloud infrastructure.", 
        icon: <Monitor className="h-6 w-6 text-gray-500" />,
        configured: false,
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredIntegrations.map((integration) => (
                    <Card key={integration.title} className="flex flex-col">
                        <CardHeader className="pb-4">
                             <div className="flex items-start justify-between">
                                {integration.icon}
                                {integration.configured && <Badge variant="secondary">Connected</Badge>}
                            </div>
                            <CardTitle className="text-lg pt-4">{integration.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow">
                             <p className="text-sm text-muted-foreground">{integration.description}</p>
                        </CardContent>
                        <CardFooter>
                             <Button asChild className="w-full" variant={integration.configured ? "secondary" : "default"}>
                                <Link href={`/admin/settings/integrations/${integration.slug}`}>
                                    {integration.configured ? "Settings" : "Configure"}
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
