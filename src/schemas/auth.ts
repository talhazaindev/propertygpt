import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export const registerFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
  phoneNumber: z
    .union([
      z.literal(""),
      z
        .string()
        .regex(/^03\d{9}$/, { message: "Phone number must be in format 03XXXXXXXXX" }),
    ])
    .optional(),
});

export const registerSchema = registerFormSchema.extend({
  signupToken: z.string().min(1, { message: "Email verification is required" }),
});

export const otpSendSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  purpose: z.enum(["SIGNUP", "AGENT_SIGNUP", "PASSWORD_RESET"]),
});

export const otpVerifySchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  purpose: z.enum(["SIGNUP", "AGENT_SIGNUP", "PASSWORD_RESET"]),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, { message: "Enter the 6-digit code" }),
});

const passwordRules = z
  .string()
  .min(8, { message: "Password must be at least 8 characters" })
  .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
  .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
  .regex(/[0-9]/, { message: "Password must contain at least one number" });

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

export const resetPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  resetToken: z.string().min(1, { message: "Reset token is required" }),
  password: passwordRules,
  confirmPassword: z.string().min(1, { message: "Confirm your password" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;
export type RegisterPayload = z.infer<typeof registerSchema>;
export type OtpSendValues = z.infer<typeof otpSendSchema>;
export type OtpVerifyValues = z.infer<typeof otpVerifySchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
