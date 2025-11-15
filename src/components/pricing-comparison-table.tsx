
"use client"

import React from "react";
import { Check, X, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type Plan } from "@/app/(admin)/admin/packages/data";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const featureTooltips: Record<string, string> = {
    maxInboxes: "Max number of active inboxes a user can have at one time.",
    inboxLifetime: "Duration in minutes an inbox exists before being purged. 0 for unlimited.",
    customPrefix: "Allow users to choose the part before the '@' (e.g., 'my-project' instead of random characters).",
    customDomains: "Number of custom domains a user can connect (e.g., test@qa.mycompany.com).",
    allowPremiumDomains: "Grant access to a pool of shorter, more memorable premium domains.",
    inboxLocking: "Allow users to 'lock' an inbox to prevent it from expiring automatically.",
    emailForwarding: "Automatically forward incoming temporary emails to a real, verified email address.",
    allowAttachments: "Allow or block incoming emails that contain file attachments.",
    maxAttachmentSize: "The maximum size in megabytes (MB) for a single email attachment.",
    sourceCodeView: "Allow users to view the raw EML source of an email, including headers.",
    linkSanitization: "Scan links for known malicious sites and warn the user before redirection.",
    exportEmails: "Allow users to download single emails (as .eml) or bulk export (as .zip).",
    maxEmailsPerInbox: "Max number of emails to store per inbox. Older emails will be deleted. 0 for unlimited.",
    totalStorageQuota: "Maximum storage in MB for all of a user's inboxes combined. 0 for unlimited.",
    searchableHistory: "Enables server-side full-text search of email history.",
    dataRetentionDays: "The number of days emails are kept, even if the inbox expires (for premium accounts). 0 for forever.",
    passwordProtection: "Allow users to secure their temporary inboxes with a password.",
    twoFactorAuth: "Enable Two-Factor Authentication (2FA) for securing user accounts.",
    spamFilteringLevel: "The level of spam filtering applied to incoming emails.",
    virusScanning: "Automatically scan all incoming attachments for malware.",
    auditLogs: "For team/business accounts, a log of actions taken by team members.",
    apiAccess: "Grant access to the developer REST API for programmatic use.",
    apiRateLimit: "Number of API requests a user can make per minute. 0 for unlimited.",
    webhooks: "Allow incoming emails to be forwarded to a user-defined webhook URL for automation.",
    prioritySupport: "Flags users for priority customer support, ensuring faster response times.",
    dedicatedAccountManager: "Assign a dedicated account manager for high-value enterprise clients.",
    noAds: "Removes all advertisements from the user interface.",
    browserExtension: "Grant access to the Chrome/Firefox browser extension.",
    teamMembers: "Number of team members a user can invite to share their plan features.",
    customBranding: "For enterprise clients, allow white-labeling of the interface.",
    usageAnalytics: "Grant access to a dashboard for viewing detailed usage statistics.",
};

const featureCategories = [
    { name: "Inbox", keys: ["maxInboxes", "inboxLifetime", "customPrefix", "customDomains", "allowPremiumDomains", "inboxLocking"] },
    { name: "Email", keys: ["emailForwarding", "allowAttachments", "maxAttachmentSize", "sourceCodeView", "linkSanitization", "exportEmails"] },
    { name: "Storage & Data", keys: ["maxEmailsPerInbox", "totalStorageQuota", "searchableHistory", "dataRetentionDays"] },
    { name: "Security & Privacy", keys: ["passwordProtection", "twoFactorAuth", "spamFilteringLevel", "virusScanning", "auditLogs"] },
    { name: "API & Automation", keys: ["apiAccess", "apiRateLimit", "webhooks"] },
    { name: "Support", keys: ["prioritySupport", "dedicatedAccountManager"] },
    { name: "General & Team", keys: ["noAds", "browserExtension", "teamMembers", "customBranding", "usageAnalytics"] },
];

const featureLabels: Record<string, string> = {
    maxInboxes: "Max Active Inboxes",
    inboxLifetime: "Inbox Lifetime (minutes)",
    customPrefix: "Customizable Prefix",
    customDomains: "Custom Domains",
    allowPremiumDomains: "Allow Premium Domains",
    inboxLocking: "Inbox Locking",
    emailForwarding: "Email Forwarding",
    allowAttachments: "Allow Attachments",
    maxAttachmentSize: "Max Attachment Size (MB)",
    sourceCodeView: "Source Code View",
    linkSanitization: "Link Sanitization",
    exportEmails: "Export Emails",
    maxEmailsPerInbox: "Max Emails Per Inbox",
    totalStorageQuota: "Total Storage Quota (MB)",
    searchableHistory: "Searchable History",
    dataRetentionDays: "Data Retention (Days)",
    passwordProtection: "Password Protection",
    twoFactorAuth: "Two-Factor Auth (Account)",
    spamFilteringLevel: "Spam Filtering Level",
    virusScanning: "Virus Scanning",
    auditLogs: "Audit Logs",
    apiAccess: "API Access",
    apiRateLimit: "API Rate Limit (req/min)",
    webhooks: "Webhooks",
    prioritySupport: "Priority Support",
    dedicatedAccountManager: "Dedicated Account Manager",
    noAds: "No Ads",
    browserExtension: "Browser Extension Access",
    teamMembers: "Team Members",
    customBranding: "Custom Branding",
    usageAnalytics: "Usage Analytics",
};

const FeatureCell = ({ value }: { value: any }) => {
    if (typeof value === 'boolean') {
        return value ? <Check className="h-6 w-6 text-green-500 mx-auto" /> : <X className="h-6 w-6 text-red-500 mx-auto" />;
    }
    if (typeof value === 'number') {
        if (value === 0) return <span>Unlimited</span>;
        return <span>{value}</span>;
    }
     if (typeof value === 'string') {
        return value !== 'none' ? <span className="capitalize">{value}</span> : <X className="h-6 w-6 text-red-500 mx-auto" />;
    }
    return <X className="h-6 w-6 text-red-500 mx-auto" />;
};

interface PricingComparisonTableProps {
  plans?: Plan[];
  removeBorder?: boolean;
}

export function PricingComparisonTable({ plans, removeBorder }: PricingComparisonTableProps) {
    const sortedPlans = React.useMemo(() => {
        if (!plans) return [];
        // The plans are pre-filtered by the parent page, just sort them.
        return [...plans].sort((a, b) => a.price - b.price);
    }, [plans]);

  return (
    <Card className={cn(removeBorder && "border-0 shadow-none")}>
      <CardContent className="p-0">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/3">Feature</TableHead>
              {sortedPlans.map(plan => (
                 <TableHead key={plan.id} className="text-center font-bold text-lg text-foreground">
                    {plan.name}
                 </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {featureCategories.map(category => (
                <React.Fragment key={category.name}>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableCell colSpan={sortedPlans.length + 1} className="font-bold text-md text-foreground">
                            {category.name}
                        </TableCell>
                    </TableRow>
                    {category.keys.map(key => (
                        <TableRow key={key}>
                            <TableCell className="font-medium flex items-center gap-2">
                                <span>{featureLabels[key] || key}</span>
                                {featureTooltips[key] && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                            <p className="max-w-xs">{featureTooltips[key]}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </TableCell>
                            {sortedPlans.map(plan => (
                                <TableCell key={`${plan.id}-${key}`} className="text-center">
                                    <FeatureCell value={(plan.features as any)[key]} />
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
