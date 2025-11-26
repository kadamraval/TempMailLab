import { z } from 'zod';

export const categorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required.'),
  slug: z.string().min(1, 'Slug is required.'),
  description: z.string().optional(),
  postCount: z.number().default(0),
});

export type Category = z.infer<typeof categorySchema>;
