
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
    // Core Usage
    maxInboxes: z.coerce.number().int().min(1, "Must have at least 1 inbox."),
    maxEmailsPerInbox: z.coerce.number().int().min(1, "Must store at least 1 email."),
    inboxLifetime: z.coerce.number().int().min(1, "Lifetime must be at least 1 minute."),
    
    // Domains
    customDomains: z.coerce.number().int().min(0, "Cannot be negative."),
    allowPremiumDomains: z.boolean().default(false),

    // Advanced Features
    emailForwarding: z.boolean().default(false),
    noAds: z.boolean().default(false),

    // Security
    passwordProtection: z.boolean().default(false),
    allowAttachments: z.boolean().default(false),
    maxAttachmentSize: z.coerce.number().int().min(0, "Cannot be negative."),
    
    // API & Automation
    apiAccess: z.boolean().default(false),
    apiRateLimit: z.coerce.number().int().min(0, "Cannot be negative."),
    webhooks: z.boolean().default(false),

    // Teams
    teamMembers: z.coerce.number().int().min(0, "Cannot be negative."),
  }),

  createdAt: z.custom<Timestamp>().optional()
})

export type Plan = z.infer<typeof planSchema> & { id: string };
