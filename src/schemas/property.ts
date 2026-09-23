import { z } from "zod";

export const propertyTypes = ["APARTMENT", "HOUSE", "VILLA", "LAND", "COMMERCIAL"] as const;

export const propertyStatusOptions = [
  "PENDING",
  "VERIFIED",
  "REJECTED",
  "ACTIVE",
  "SOLD"
] as const;

export const propertyListingTypes = ["SALE", "RENTAL"] as const;

export const verificationDocumentTypes = [
  "CNIC",
  "POWER_OF_ATTORNEY",
  "REGISTRY",
  "FRD",
] as const;

export const verificationDocumentTypeLabels: Record<
  (typeof verificationDocumentTypes)[number],
  string
> = {
  CNIC: "CNIC",
  POWER_OF_ATTORNEY: "Power of Attorney",
  REGISTRY: "Registry",
  FRD: "FRD",
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB for property images
export const MAX_DOCUMENT_FILE_SIZE = 25 * 1024 * 1024; // 25MB for verification documents
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export const ACCEPTED_DOCUMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
];

export function isAcceptedImageFile(file: File): boolean {
  return ACCEPTED_IMAGE_TYPES.includes(file.type) && file.size <= MAX_FILE_SIZE;
}

export function isAcceptedDocumentFile(file: File): boolean {
  const mimeOk = ACCEPTED_DOCUMENT_TYPES.includes(file.type);
  const name = file.name.toLowerCase();
  const extensionOk =
    name.endsWith(".pdf") || name.endsWith(".jpg") || name.endsWith(".jpeg");
  return (mimeOk || extensionOk) && file.size <= MAX_DOCUMENT_FILE_SIZE;
}

export function validateImageFiles(files: File[]): string | null {
  if (files.length === 0) {
    return "At least one property image is required";
  }
  if (files.some((file) => file.size > MAX_FILE_SIZE)) {
    return "Image size exceeds the 5MB limit";
  }
  if (files.some((file) => !ACCEPTED_IMAGE_TYPES.includes(file.type))) {
    return "Only JPEG, PNG, and WEBP formats are allowed";
  }
  return null;
}

export function validateVerificationDocument(
  type: string | "",
  file: File | null
): string | null {
  if (!type) {
    return "Please select a document type.";
  }
  if (!file) {
    return "Please select a PDF or JPEG file.";
  }
  const name = file.name.toLowerCase();
  const mimeOk = ACCEPTED_DOCUMENT_TYPES.includes(file.type);
  const extensionOk =
    name.endsWith(".pdf") || name.endsWith(".jpg") || name.endsWith(".jpeg");
  if (!mimeOk && !extensionOk) {
    return "Only PDF and JPEG files are allowed.";
  }
  if (file.size > MAX_DOCUMENT_FILE_SIZE) {
    return "Document size exceeds the 25MB limit.";
  }
  return null;
}

// Client-side only schema (images handled separately as File[] state)
export const propertyClientSchema = z.object({
  title: z
    .string()
    .min(10, "Title must be at least 10 characters")
    .max(100, "Title cannot exceed 100 characters"),
  description: z
    .string()
    .min(50, "Description must be at least 50 characters")
    .max(2000, "Description cannot exceed 2000 characters"),
  price: z
    .number({
      required_error: "Price is required",
      invalid_type_error: "Price must be a number",
    })
    .positive("Price must be greater than 0"),
  type: z.enum(propertyTypes, {
    required_error: "Property type is required",
  }),
  listingType: z.enum(propertyListingTypes).default("SALE"),
  bedrooms: z.number().int().positive().optional(),
  bathrooms: z.number().int().positive().optional(),
  area: z
    .number({
      required_error: "Area is required",
      invalid_type_error: "Area must be a number",
    })
    .positive("Area must be greater than 0"),
  address: z
    .string()
    .min(5, "Address must be at least 5 characters")
    .max(200, "Address cannot exceed 200 characters"),
  cityId: z.string({
    required_error: "City is required",
  }),
});

// SSR-safe schema without FileList validation
export const propertySchema = z.object({
  title: z
    .string()
    .min(10, "Title must be at least 10 characters")
    .max(100, "Title cannot exceed 100 characters"),
  description: z
    .string()
    .min(50, "Description must be at least 50 characters")
    .max(2000, "Description cannot exceed 2000 characters"),
  price: z
    .number({
      required_error: "Price is required",
      invalid_type_error: "Price must be a number",
    })
    .positive("Price must be greater than 0"),
  type: z.enum(propertyTypes, {
    required_error: "Property type is required",
  }),
  listingType: z.enum(propertyListingTypes).default("SALE"),
  bedrooms: z.number().int().positive().optional(),
  bathrooms: z.number().int().positive().optional(),
  area: z
    .number({
      required_error: "Area is required",
      invalid_type_error: "Area must be a number",
    })
    .positive("Area must be greater than 0"),
  address: z
    .string()
    .min(5, "Address must be at least 5 characters")
    .max(200, "Address cannot exceed 200 characters"),
  cityId: z.string({
    required_error: "City is required",
  }),
  imageUrls: z.array(z.string()).min(1, "At least one property image is required"),
  verificationDocuments: z
    .array(
      z.object({
        type: z.enum(verificationDocumentTypes),
        url: z.string().min(1),
        fileName: z.string().min(1),
        uploadedAt: z.union([z.string(), z.date()]).optional(),
      })
    )
    .min(1, "At least one verification document is required"),
});

// Search schema for property filtering
export const propertySearchSchema = z.object({
  query: z.string().optional(),
  city: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  propertyType: z.enum(propertyTypes).optional(),
  listingType: z.enum(propertyListingTypes).optional(),
  bedrooms: z.coerce.number().optional(),
  bathrooms: z.coerce.number().optional(),
});

export const propertyUpdateSchema = propertyClientSchema.partial();

export type PropertyFormValues = z.infer<typeof propertyClientSchema>;
export type PropertySearchValues = z.infer<typeof propertySearchSchema>;
export type PropertyUpdateValues = z.infer<typeof propertyUpdateSchema>;
export type VerificationDocumentType = (typeof verificationDocumentTypes)[number];

export type VerificationDocument = {
  type: VerificationDocumentType;
  url: string;
  fileName: string;
  uploadedAt?: string | Date;
};

export const propertyApiResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  price: z.number(),
  type: z.enum(propertyTypes),
  listingType: z.enum(propertyListingTypes),
  bedrooms: z.number().optional().nullable(),
  bathrooms: z.number().optional().nullable(),
  area: z.number(),
  address: z.string(),
  city: z.object({
    id: z.string(),
    name: z.string(),
    province: z.string(),
  }),
  images: z.array(z.string()),
  verificationDocuments: z
    .array(
      z.object({
        type: z.enum(verificationDocumentTypes),
        url: z.string(),
        fileName: z.string(),
        uploadedAt: z.union([z.string(), z.date()]).optional(),
      })
    )
    .optional()
    .default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
  status: z.string(),
  userId: z.string(),
  featured: z.boolean().optional(),
  tracking: z
    .object({
      status: z.string(),
      pendingReason: z.string().optional().nullable(),
      verificationDate: z.string().optional().nullable(),
      statusHistory: z
        .array(
          z.object({
            status: z.string(),
            date: z.string(),
            note: z.string().optional().nullable(),
          })
        )
        .optional(),
    })
    .optional(),
  user: z
    .object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      image: z.string().optional().nullable(),
    })
    .optional(),
});

export type PropertyApiResponse = z.infer<typeof propertyApiResponseSchema>;
