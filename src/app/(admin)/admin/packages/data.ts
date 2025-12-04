
"use client"

import { z } from "zod"
import type { Timestamp } from "firebase/firestore"

// This schema now reflects the comprehensive feature list from our deep research.
export const planSchema = z.object({
  id: z.string().optional(), // Optional for new plans
  name: z.string().min(1, "Plan name is required."),
  price: z.coerce.number().min(0, "Price must be a positive number."),
  cycle: z.enum(["monthly", "yearly"]),
  status: z.enum(["active", "archived"]),
  
  features: z.object({
    // 1. Inbox Features
    maxInboxes: z.coerce.number().int().min(0, "Cannot be negative."),
    inboxLifetime: z.coerce.number().int().min(0, "Cannot be negative. 0 for unlimited."),
    customPrefix: z.boolean().default(false),
    customDomains: z.coerce.number().int().min(0, "Cannot be negative."),
    allowPremiumDomains: z.boolean().default(false),
    inboxLocking: z.boolean().default(false),
    
    // 2. Email Features
    emailForwarding: z.boolean().default(false),
    allowAttachments: z.boolean().default(false),
    maxAttachmentSize: z.coerce.number().int().min(0, "Cannot be negative."),
    sourceCodeView: z.boolean().default(false),
    linkSanitization: z.boolean().default(false),
    exportEmails: z.boolean().default(false),

    // 3. Storage & Data Management
    maxEmailsPerInbox: z.coerce.number().int().min(0, "Cannot be negative. 0 for unlimited."),
    totalStorageQuota: z.coerce.number().int().min(0, "Cannot be negative. 0 for unlimited."),
    searchableHistory: z.boolean().default(false),
    dataRetentionDays: z.coerce.number().int().min(0, "Cannot be negative. 0 for unlimited."),
    
    // 4. Security & Privacy
    passwordProtection: z.boolean().default(false),
    twoFactorAuth: z.boolean().default(false),
    spamFilteringLevel: z.enum(["none", "basic", "aggressive"]).default("basic"),
    virusScanning: z.boolean().default(false),
    auditLogs: z.boolean().default(false),
    
    // 5. API & Automation
    apiAccess: z.boolean().default(false),
    apiRateLimit: z.coerce.number().int().min(0, "Cannot be negative."),
    webhooks: z.boolean().default(false),
    
    // 6. Support
    prioritySupport: z.boolean().default(false),
    dedicatedAccountManager: z.boolean().default(false),

    // 7. General (User Experience, Account & Team)
    noAds: z.boolean().default(false),
    browserExtension: z.boolean().default(false),
    teamMembers: z.coerce.number().int().min(0, "Cannot be negative."),
    customBranding: z.boolean().default(false),
    usageAnalytics: z.boolean().default(false),

    // New Features from user request
    star: z.boolean().default(false),
    spam: z.boolean().default(false),
    block: z.boolean().default(false),
    filter: z.boolean().default(false),
    qrCode: z.boolean().default(false),
    extendTime: z.coerce.number().int().min(0).default(0),
    dailyInboxLimit: z.coerce.number().int().min(0).default(0),
    dailyEmailLimit: z.coerce.number().int().min(0).default(0),
  }),

  createdAt: z.custom<Timestamp>().optional()
})

export type Plan = z.infer<typeof planSchema> & { id: string };

