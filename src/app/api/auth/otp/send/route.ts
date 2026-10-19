import { NextResponse } from "next/server";
import prisma from "@/lib/prismadb";
import { sendSignupOtpEmail } from "@/lib/email";
import { createAndStoreOtp, OTP_EXPIRY_MINUTES, normalizeEmail } from "@/lib/otp";
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
