import { z } from 'zod';

export const propertyRequestSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 characters" }),
  city: z.string().min(1, { message: "City is required" }),
  budget: z.coerce.number().min(1, { message: "Budget is required" }),
  propertyType: z.string().min(1, { message: "Property type is required" }),
  bedrooms: z.coerce.number().min(0).optional(),
  bathrooms: z.coerce.number().min(0).optional(),
  area: z.coerce.number().min(0).optional(),
  additionalDetails: z.string().optional(),
  status: z.enum(['PENDING', 'REVIEWED', 'CONTACTED', 'COMPLETED', 'CANCELED']).default('PENDING'),
});

export const updateRequestStatusSchema = z.object({
  id: z.string(),
  status: z.enum(['PENDING', 'REVIEWED', 'CONTACTED', 'COMPLETED', 'CANCELED']),
});

export type PropertyRequestFormValues = z.infer<typeof propertyRequestSchema>;
export type UpdateRequestStatusValues = z.infer<typeof updateRequestStatusSchema>; 