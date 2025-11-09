
import { z } from "zod"
import type { Timestamp } from "firebase/firestore"

export const planSchema = z.object({
  id: z.string().optional(), // Optional for new plans
  name: z.string().min(1, "Plan name is required."),
  price: z.coerce.number().min(0, "Price must be a positive number."),
  features: z.string().optional(),
  status: z.enum(["active", "archived"]),
  cycle: z.enum(["monthly", "yearly"]),
  createdAt: z.custom<Timestamp>().optional()
})

export type Plan = z.infer<typeof planSchema> & { id: string };
