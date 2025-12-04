
"use client"

import { z } from "zod"
import type { Timestamp } from "firebase/firestore"

export const planSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Plan name is required."),
  planType: z.enum(['guest', 'freemium', 'pro']).default('guest'),
  billing: z.enum(['monthly', 'yearly', 'lifetime_free']).default('lifetime_free'),
  price: z.coerce.number().min(0, "Price must be a positive number."),
  status: z.enum(["active", "archived"]),
  
  features: z.object({
    // General
    teamMembers: z.coerce.number().int().min(0, "Cannot be negative."),
    noAds: z.boolean().default(false),
    usageAnalytics: z.boolean().default(false),
    browserExtension: z.boolean().default(false),
    customBranding: z.boolean().default(false),
    prioritySupport: z.boolean().default(false),
    dedicatedAccountManager: z.boolean().default(false),
    
    // Inbox
    maxInboxes: z.coerce.number().int().min(0, "Cannot be negative."),
    dailyInboxLimit: z.coerce.number().int().min(0).default(0),
    inboxLifetime: z.coerce.number().int().min(0, "Cannot be negative. 0 for unlimited."),
    extendTime: z.boolean().default(false),
    customPrefix: z.boolean().default(false),
    inboxLocking: z.boolean().default(false),
    qrCode: z.boolean().default(false),

    // Email
    dailyEmailLimit: z.coerce.number().int().min(0).default(0),
    maxEmailsPerInbox: z.coerce.number().int().min(0, "Cannot be negative. 0 for unlimited."),
    allowAttachments: z.boolean().default(false),
    maxAttachmentSize: z.coerce.number().int().min(0, "Cannot be negative."),
    emailForwarding: z.boolean().default(false),
    exportEmails: z.boolean().default(false),
    sourceCodeView: z.boolean().default(false),

    // Custom Domain
    customDomains: z.coerce.number().int().min(0, "Cannot be negative.").default(0),
    dailyCustomDomainInboxLimit: z.coerce.number().int().min(0).default(0),
    totalCustomDomainInboxLimit: z.coerce.number().int().min(0).default(0),
    allowPremiumDomains: z.boolean().default(false),

    // Storage
    totalStorageQuota: z.coerce.number().int().min(0, "Cannot be negative. 0 for unlimited."),
    dataRetentionDays: z.coerce.number().int().min(0, "Cannot be negative. 0 for unlimited."),
    
    // Security & Privacy
    passwordProtection: z.boolean().default(false),
    twoFactorAuth: z.boolean().default(false),
    spamFilteringLevel: z.enum(["none", "basic", "aggressive"]).default("basic"),
    virusScanning: z.boolean().default(false),
    auditLogs: z.boolean().default(false),
    linkSanitization: z.boolean().default(false),
    spam: z.boolean().default(false),
    block: z.boolean().default(false),
    filter: z.boolean().default(false),

    // API & Automation
    apiAccess: z.boolean().default(false),
    apiRateLimit: z.coerce.number().int().min(0, "Cannot be negative."),
    webhooks: z.boolean().default(false),
  }),

  createdAt: z.custom<Timestamp>().optional()
})

export type Plan = z.infer<typeof planSchema> & { id: string };

    