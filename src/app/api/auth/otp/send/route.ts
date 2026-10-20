import { NextResponse } from "next/server";
import prisma from "@/lib/prismadb";
import { sendPasswordResetEmail, sendSignupOtpEmail } from "@/lib/email";
import {
  createAndStoreOtp,
  createSignupToken,
  OTP_EXPIRY_MINUTES,
  normalizeEmail,
} from "@/lib/otp";
import { otpSendSchema } from "@/schemas/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = otpSendSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input data", issues: validation.error.issues },
        { status: 400 }
      );
    }

    const email = normalizeEmail(validation.data.email);
    const { purpose } = validation.data;

    if (purpose === "PASSWORD_RESET") {
      const [user, teamMember] = await Promise.all([
        prisma.user.findUnique({ where: { email }, select: { id: true, name: true, hashedPassword: true } }),
        prisma.teamMember.findUnique({
          where: { email },
          select: { id: true, name: true, hashedPassword: true },
        }),
      ]);

      const account =
        teamMember?.hashedPassword
          ? { name: teamMember.name }
          : user?.hashedPassword
            ? { name: user.name }
            : null;

      // Always return the same message so we do not leak whether the email exists
      const genericResponse = {
        message:
          "If an account exists for this email, we sent a password reset code and link.",
        expiresInMinutes: OTP_EXPIRY_MINUTES,
      };

      if (!account) {
        return NextResponse.json(genericResponse);
      }

      const stored = await createAndStoreOtp(email, purpose);
      if (!stored.ok) {
        return NextResponse.json(
          { error: stored.error, retryAfterSeconds: stored.retryAfterSeconds },
          { status: 429 }
        );
      }

      const resetToken = createSignupToken(email, "PASSWORD_RESET");
      const sent = await sendPasswordResetEmail({
        to: email,
        name: account.name || "there",
        code: stored.code,
        resetToken,
        expiresInMinutes: OTP_EXPIRY_MINUTES,
      });

      if (!sent.ok) {
        return NextResponse.json(
          { error: sent.error || "Failed to send password reset email" },
          { status: 502 }
        );
      }

      return NextResponse.json(genericResponse);
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const stored = await createAndStoreOtp(email, purpose);
    if (!stored.ok) {
      return NextResponse.json(
        { error: stored.error, retryAfterSeconds: stored.retryAfterSeconds },
        { status: 429 }
      );
    }

    const sent = await sendSignupOtpEmail({
      to: email,
      code: stored.code,
      purpose,
      expiresInMinutes: OTP_EXPIRY_MINUTES,
    });

    if (!sent.ok) {
      return NextResponse.json(
        { error: sent.error || "Failed to send verification email" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      message: "Verification code sent",
      expiresInMinutes: OTP_EXPIRY_MINUTES,
    });
  } catch (error) {
    console.error("[OTP_SEND]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
