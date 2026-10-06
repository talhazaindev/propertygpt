import { z } from "zod";

export const agentApplySchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  businessName: z.string().min(2, { message: "Business name is required" }),
  location: z.string().min(2, { message: "Location is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  phoneNumber: z
    .string()
    .regex(/^03\d{9}$/, { message: "Phone number must be in format 03XXXXXXXXX" }),
  businessAddress: z.string().min(5, { message: "Business address is required" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
});

export const agentRequestCreateSchema = z.object({
  type: z.enum([
    "PROPERTY_ASK",
    "VERIFICATION_SUPPORT",
    "CLIENT_REFERRAL",
    "DEAL_CLOSE",
    "SUPPORT",
  ]),
  title: z.string().min(3, { message: "Title is required" }),
  description: z.string().min(10, { message: "Please provide more detail" }),
  propertyId: z.string().optional().nullable(),
  clientName: z.string().optional().nullable(),
  clientPhone: z.string().optional().nullable(),
  clientEmail: z.string().email().optional().nullable().or(z.literal("")),
  estimatedValue: z.coerce.number().positive().optional().nullable(),
});

export const agentProfileAdminPatchSchema = z.object({
  status: z.enum(["PENDING", "ACTIVE", "SUSPENDED", "REJECTED"]).optional(),
  identityVerified: z.boolean().optional(),
  officeVerified: z.boolean().optional(),
  propertiesSold: z.number().int().min(0).optional(),
  verifiedListings: z.number().int().min(0).optional(),
  documentDisputes: z.number().int().min(0).optional(),
  cancelledTransactions: z.number().int().min(0).optional(),
  avgResponseMinutes: z.number().int().min(0).nullable().optional(),
  memberSince: z.string().datetime().nullable().optional().or(z.string().nullable().optional()),
  trustScore: z.number().int().min(0).max(100).optional(),
  trustScoreOverride: z.boolean().optional(),
  isGolden: z.boolean().optional(),
  dedicatedSupportId: z.string().nullable().optional(),
  adminNotes: z.string().nullable().optional(),
  recomputeTrustScore: z.boolean().optional(),
});

export const agentRequestAdminPatchSchema = z.object({
  status: z
    .enum(["PENDING", "IN_REVIEW", "APPROVED", "COMPLETED", "REJECTED", "CANCELLED"])
    .optional(),
  commissionAmount: z.number().min(0).nullable().optional(),
  bonusAmount: z.number().min(0).nullable().optional(),
  payoutStatus: z.enum(["PENDING", "APPROVED", "PAID"]).optional(),
  adminNotes: z.string().nullable().optional(),
  reviewedById: z.string().nullable().optional(),
});

export const agentTargetSchema = z.object({
  label: z.string().min(1).default("This month"),
  periodStart: z.string(),
  periodEnd: z.string(),
  dealsTarget: z.number().int().min(0).default(0),
  verificationsTarget: z.number().int().min(0).default(0),
  referralsTarget: z.number().int().min(0).default(0),
  rewardDescription: z.string().nullable().optional(),
  rewardAmount: z.number().min(0).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const agentPropertyVerificationSchema = z.object({
  remarks: z
    .string()
    .min(10, { message: "Remarks must be at least 10 characters" }),
  verifiedItems: z
    .string()
    .min(10, { message: "Describe what you verified (at least 10 characters)" }),
  verificationSource: z
    .string()
    .min(5, { message: "Tell us your source of verification" }),
  documents: z
    .array(
      z.object({
        type: z.string().min(1),
        url: z.string().url(),
        fileName: z.string().min(1),
      })
    )
    .min(1, { message: "Upload at least one verified document" }),
  markInProgress: z.boolean().optional(),
  // legacy alias
  notes: z.string().optional(),
});

export type AgentApplyFormValues = z.infer<typeof agentApplySchema>;
export type AgentRequestCreateValues = z.infer<typeof agentRequestCreateSchema>;
export type AgentTargetFormValues = z.infer<typeof agentTargetSchema>;
export type AgentPropertyVerificationValues = z.infer<
  typeof agentPropertyVerificationSchema
>;
