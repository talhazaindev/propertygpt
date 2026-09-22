import { z } from 'zod';

export const blogStatuses = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;

export const createBlogSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }).max(100, { message: "Title must be at most 100 characters" }),
  content: z.string().min(100, { message: "Content must be at least 100 characters" }),
  summary: z.string().min(20, { message: "Summary must be at least 20 characters" }).max(300, { message: "Summary must be at most 300 characters" }),
  tags: z.array(z.string()).min(1, { message: "At least one tag is required" }),
  status: z.enum(blogStatuses).default('DRAFT'),
});

export const updateBlogSchema = createBlogSchema.partial().extend({
  id: z.string(),
  publishedAt: z.date().optional().nullable(),
});

export const blogApiResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  summary: z.string(),
  coverImage: z.string(),
  images: z.array(z.string()),
  status: z.enum(blogStatuses),
  tags: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
  publishedAt: z.string().optional().nullable(),
  author: z.object({
    id: z.string(),
    name: z.string(),
    image: z.string().optional().nullable(),
  }),
});

export type BlogFormData = z.infer<typeof createBlogSchema>;
export type BlogApiResponse = z.infer<typeof blogApiResponseSchema>; 