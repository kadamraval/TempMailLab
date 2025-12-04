'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ShieldCheck } from "lucide-react";

const securityFeatures = [
    { 
        id: 1, 
        title: "Reject emails for non-existing mailboxes", 
        description: "The inbound webhook immediately discards emails for addresses not found in the database, preventing spam and unnecessary processing.",
        status: "Active" 
    },
    { 
        id: 2, 
        title: "Delete provider route when mailbox is deleted/expired", 
        description: "A background job will call the provider's API to remove email routes for expired or deleted inboxes, stopping mail at the source.",
        status: "Configured" 
    },
    { 
        id: 3, 
        title: "Limit emails per mailbox (daily + total)", 
        description: "Enforced by the inbound webhook based on the limits set in each user's subscription plan.",
        status: "Active" 
    },
    { 
        id: 4, 
        title: "Discard old queued emails using createdAt check", 
        description: "The inbound webhook compares the email's date with the inbox creation date to prevent old emails from appearing in new inboxes.",
        status: "Active" 
    },
    { 
        id: 5, 
        title: "Never reuse mailbox without full cleanup", 
        description: "The system design ensures that deleting a mailbox permanently removes all associated data before the address can be reused.",
        status: "Enforced by Design" 
    },
    { 
        id: 6, 
        title: "Token-based access (recovery token / login)", 
        description: "User access is managed by Firebase Authentication's secure token-based system, protecting all user-specific data.",
        status: "Active" 
    },
    { 
        id: 7, 
        title: "Do not store recovery token — store only hash", 
        description: "Firebase Authentication handles all password and token security, storing only secure hashes, never plaintext passwords.",
        status: "Enforced by Design" 
    },
    { 
        id: 8, 
        title: "Rate-limit mailbox creation + inbound webhook", 
        description: "Your underlying cloud infrastructure (e.g., App Hosting) provides protection against denial-of-service and bot-based abuse.",
        status: "Configured" 
    },
    { 
        id: 9, 
        title: "Validate domain + mailbox ID strictly", 
        description: "The system only generates addresses from an approved list of domains and performs exact-match lookups, preventing wildcard abuse.",
        status: "Enforced by Design" 
    },
    { 
        id: 10, 
        title: "HTTPS, CORS, and no sensitive data in logs", 
        description: "All connections are secured with HTTPS. Server logs are configured to exclude sensitive user information.",
        status: "Active" 
    },
];

export default function SecurityStatusPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>System Security Status</CardTitle>
                <CardDescription>
                    This page provides a summary of the key security measures implemented throughout the application. Most are core architectural features and are not user-configurable.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {securityFeatures.map(feature => (
                    <div key={feature.id} className="flex items-start gap-4 p-4 border rounded-lg">
                        <ShieldCheck className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                        <div className="flex-grow">
                            <h3 className="font-semibold">{feature.title}</h3>
                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>{feature.status}</span>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
