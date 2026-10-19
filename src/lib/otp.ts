/**
 * Email OTP helpers for signup verification (buyer + agent).
 */

import { createHmac, randomInt, timingSafeEqual } from "crypto";
import bcrypt from "bcrypt";
import type { OtpPurpose } from "@prisma/client";
import prisma from "@/lib/prismadb";

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 10);
const MAX_ATTEMPTS = 5;
const SIGNUP_TOKEN_TTL_MS = 15 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

export type SignupTokenPayload = {
  email: string;
  purpose: OtpPurpose;
  exp: number;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is not configured");
  }
  return secret;
}

export function generateOtpCode(): string {
  const max = 10 ** OTP_LENGTH;
  const min = 10 ** (OTP_LENGTH - 1);
  return String(randomInt(min, max));
}

export async function hashOtpCode(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}

export async function compareOtpCode(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}

export function createSignupToken(email: string, purpose: OtpPurpose): string {
  const payload: SignupTokenPayload = {
    email: normalizeEmail(email),
    purpose,
    exp: Date.now() + SIGNUP_TOKEN_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", getSecret()).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifySignupToken(
  token: string,
  email: string,
  purpose: OtpPurpose
): { ok: true } | { ok: false; error: string } {
  const parts = token.split(".");
  if (parts.length !== 2) {
    return { ok: false, error: "Invalid verification token" };
  }

  const [encoded, sig] = parts;
  const expected = createHmac("sha256", getSecret()).update(encoded).digest("base64url");

  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, error: "Invalid verification token" };
    }
  } catch {
    return { ok: false, error: "Invalid verification token" };
  }

  let payload: SignupTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return { ok: false, error: "Invalid verification token" };
  }

  if (payload.exp < Date.now()) {
    return { ok: false, error: "Verification expired. Please request a new code." };
  }

  if (normalizeEmail(payload.email) !== normalizeEmail(email) || payload.purpose !== purpose) {
    return { ok: false, error: "Email verification does not match this signup" };
  }

  return { ok: true };
}

export async function createAndStoreOtp(
  email: string,
  purpose: OtpPurpose
): Promise<
  | { ok: true; code: string; expiresAt: Date }
  | { ok: false; error: string; retryAfterSeconds?: number }
> {
  const normalized = normalizeEmail(email);
  const latest = await prisma.emailOtp.findFirst({
    where: { email: normalized, purpose, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (latest && Date.now() - latest.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    const retryAfterSeconds = Math.ceil(
      (RESEND_COOLDOWN_MS - (Date.now() - latest.createdAt.getTime())) / 1000
    );
    return {
      ok: false,
      error: `Please wait ${retryAfterSeconds}s before requesting another code`,
      retryAfterSeconds,
    };
  }

  // Invalidate outstanding codes for this email + purpose
  await prisma.emailOtp.updateMany({
    where: { email: normalized, purpose, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  const code = generateOtpCode();
  const codeHash = await hashOtpCode(code);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.emailOtp.create({
    data: {
      email: normalized,
      purpose,
      codeHash,
      expiresAt,
    },
  });

  return { ok: true, code, expiresAt };
}

export async function verifyStoredOtp(
  email: string,
  purpose: OtpPurpose,
  code: string
): Promise<{ ok: true; signupToken: string } | { ok: false; error: string }> {
  const normalized = normalizeEmail(email);
  const record = await prisma.emailOtp.findFirst({
    where: { email: normalized, purpose, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    return { ok: false, error: "No verification code found. Please request a new one." };
  }

  if (record.expiresAt.getTime() < Date.now()) {
    await prisma.emailOtp.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    });
    return { ok: false, error: "Code expired. Please request a new one." };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await prisma.emailOtp.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    });
    return { ok: false, error: "Too many attempts. Please request a new code." };
  }

  const valid = await compareOtpCode(code.trim(), record.codeHash);
  if (!valid) {
    await prisma.emailOtp.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, error: "Invalid verification code" };
  }

  await prisma.emailOtp.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  });

  return { ok: true, signupToken: createSignupToken(normalized, purpose) };
}

export { normalizeEmail, OTP_EXPIRY_MINUTES };
