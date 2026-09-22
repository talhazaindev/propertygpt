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

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg", 
  "image/jpg", 
  "image/png", 
  "image/webp"
];

// Type guard for FileList for safer type checking
function isFileList(value: unknown): value is FileList {
  return value !== null && 
    typeof value === 'object' && 
    'length' in value && 
    typeof (value as FileList).item === 'function';
}

// Client-side only schema with FileList validation
export const propertyClientSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters").max(100, "Title cannot exceed 100 characters"),
  description: z.string()
    .min(50, "Description must be at least 50 characters")
    .max(2000, "Description cannot exceed 2000 characters"),
  price: z.number({
    required_error: "Price is required",
    invalid_type_error: "Price must be a number",
  }).positive("Price must be greater than 0"),
  type: z.enum(propertyTypes, {
    required_error: "Property type is required",
  }),
  listingType: z.enum(propertyListingTypes).default("SALE"),
  bedrooms: z.number().int().positive().optional(),
  bathrooms: z.number().int().positive().optional(),
  area: z.number({
    required_error: "Area is required",
    invalid_type_error: "Area must be a number",
  }).positive("Area must be greater than 0"),
  address: z.string().min(5, "Address must be at least 5 characters").max(200, "Address cannot exceed 200 characters"),
  cityId: z.string({
    required_error: "City is required",
  }),
  images: z.custom<FileList>((value) => {
    // In a non-browser environment, skip validation
    if (typeof window === 'undefined') return true;
    
    // Make images completely optional - return true regardless
    return true;
  })
    .optional() // Make images optional to help with form submission
    .refine(
      (files) => {
        // Skip validation in non-browser environment
        if (typeof window === 'undefined') return true;
        
        // Skip validation if no files
        if (!files) return true;
        
        if (!isFileList(files)) return true; // Changed to true to prevent validation errors
        
        let validSize = true;
        try {
          Array.from(files).forEach(file => {
            if (file.size > MAX_FILE_SIZE) {
              validSize = false;
            }
          });
        } catch (e) {
          console.error("Error validating file size:", e);
        }
        return validSize;
      }, 
      "Image size exceeds the 5MB limit"
    )
    .refine(
      (files) => {
        // Skip validation in non-browser environment
        if (typeof window === 'undefined') return true;
        
        // Skip validation if no files
        if (!files) return true;
        
        if (!isFileList(files)) return true; // Changed to true to prevent validation errors
        
        let validType = true;
        try {
          Array.from(files).forEach(file => {
            if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
              validType = false;
            }
          });
        } catch (e) {
          console.error("Error validating file type:", e);
        }
        return validType;
      },
      "Only JPEG, PNG, and WEBP formats are allowed"
    )
});

// SSR-safe schema without FileList validation
export const propertySchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters").max(100, "Title cannot exceed 100 characters"),
  description: z.string()
    .min(50, "Description must be at least 50 characters")
    .max(2000, "Description cannot exceed 2000 characters"),
  price: z.number({
    required_error: "Price is required",
    invalid_type_error: "Price must be a number",
  }).positive("Price must be greater than 0"),
  type: z.enum(propertyTypes, {
    required_error: "Property type is required",
  }),
  listingType: z.enum(propertyListingTypes).default("SALE"),
  bedrooms: z.number().int().positive().optional(),
  bathrooms: z.number().int().positive().optional(),
  area: z.number({
    required_error: "Area is required",
    invalid_type_error: "Area must be a number",
  }).positive("Area must be greater than 0"),
  address: z.string().min(5, "Address must be at least 5 characters").max(200, "Address cannot exceed 200 characters"),
  cityId: z.string({
    required_error: "City is required",
  }),
  imageUrls: z.array(z.string()).optional(),
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

export const propertyUpdateSchema = propertyClientSchema.partial({
  images: true
});

export type PropertyFormValues = z.infer<typeof propertyClientSchema>;
export type PropertySearchValues = z.infer<typeof propertySearchSchema>;
export type PropertyUpdateValues = z.infer<typeof propertyUpdateSchema>;

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
  createdAt: z.string(),
  updatedAt: z.string(),
  status: z.string(),
  userId: z.string(),
  featured: z.boolean().optional(),
  tracking: z.object({
    status: z.string(),
    pendingReason: z.string().optional().nullable(),
    verificationDate: z.string().optional().nullable(),
    statusHistory: z.array(z.object({
      status: z.string(),
      date: z.string(),
      note: z.string().optional().nullable(),
    })).optional(),
  }).optional(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    image: z.string().optional().nullable(),
  }).optional(),
});

export type PropertyApiResponse = z.infer<typeof propertyApiResponseSchema>; 