import { z } from 'zod';
import type { Timestamp } from 'firebase/firestore';

export const blogPostSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required.'),
  slug: z.string().min(1, 'Slug is required.'),
  content: z.string().min(1, 'Content is required.'),
  excerpt: z.string().optional(),
  featuredImage: z.string().url().optional().or(z.literal('')),
  status: z.enum(['draft', 'published']),
  authorId: z.string(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  publishedAt: z.custom<Timestamp>().optional(),
  createdAt: z.custom<Timestamp>().optional(),
  updatedAt: z.custom<Timestamp>().optional(),
});

export type BlogPost = z.infer<typeof blogPostSchema> & { id: string };
