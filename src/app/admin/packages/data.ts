
import { z } from "zod"

export const planSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  features: z.string(),
  status: z.enum(["active", "archived"]),
  cycle: z.enum(["monthly", "yearly"]),
})

export type Plan = z.infer<typeof planSchema>
