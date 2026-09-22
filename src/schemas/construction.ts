import { z } from 'zod';

export const constructionRequestSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 characters" }),
  city: z.string().min(1, { message: "City is required" }),
  budget: z.coerce.number().min(1, { message: "Budget is required" }),
  projectType: z.string().min(1, { message: "Project type is required" }),
  landArea: z.coerce.number().min(0, { message: "Land area is required" }),
  floors: z.coerce.number().min(1).optional(),
  bedrooms: z.coerce.number().min(0).optional(),
  bathrooms: z.coerce.number().min(0).optional(),
  hasBlueprint: z.boolean().default(false),
  timeline: z.string().optional(),
  additionalDetails: z.string().optional(),
  status: z.enum(['PENDING', 'REVIEWED', 'CONTACTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED']).default('PENDING'),
});

export const updateConstructionStatusSchema = z.object({
  id: z.string(),
  status: z.enum(['PENDING', 'REVIEWED', 'CONTACTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED']),
});

export type ConstructionRequestFormValues = z.infer<typeof constructionRequestSchema>;
export type UpdateConstructionStatusValues = z.infer<typeof updateConstructionStatusSchema>; 