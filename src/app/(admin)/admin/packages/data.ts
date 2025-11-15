
"use client"

import { z } from "zod"
import type { Timestamp } from "firebase/firestore"

export const planSchema = z.object({
  id: z.string().optional(), // Optional for new plans
  name: z.string().min(1, "Plan name is required."),
  price: z.coerce.number().min(0, "Price must be a positive number."),
  cycle: z.enum(["monthly", "yearly"]),
  status: z.enum(["active", "archived"]),
  
  features: z.object({
    // 1. Inbox Features
    maxInboxes: z.coerce.number().int().min(1, "Must have at least 1 inbox."),
    inboxLifetime: z.coerce.number().int().min(1, "Lifetime must be at least 1 minute."),
    customDomains: z.coerce.number().int().min(0, "Cannot be negative."),
    allowPremiumDomains: z.boolean().default(false),
    
    // 2. Email Features
    allowAttachments: z.boolean().default(false),
    maxAttachmentSize: z.coerce.number().int().min(0, "Cannot be negative."),
    emailForwarding: z.boolean().default(false),
    exportEmails: z.boolean().default(false),

    // 3. Storage & Data Management
    maxEmailsPerInbox: z.coerce.number().int().min(1, "Must store at least 1 email."),
    searchableHistory: z.boolean().default(false),
    
    // 4. Security & Privacy
    passwordProtection: z.boolean().default(false),
    
    // 5. API & Automation
    apiAccess: z.boolean().default(false),
    apiRateLimit: z.coerce.number().int().min(0, "Cannot be negative."),
    webhooks: z.boolean().default(false),
    
    // 6. Support
    prioritySupport: z.boolean().default(false),

    // 7. General (User Experience, Account & Team)
    noAds: z.boolean().default(false),
    teamMembers: z.coerce.number().int().min(0, "Cannot be negative."),
    usageAnalytics: z.boolean().default(false),
  }),

  createdAt: z.custom<Timestamp>().optional()
})

export type Plan = z.infer<typeof planSchema> & { id: string };
