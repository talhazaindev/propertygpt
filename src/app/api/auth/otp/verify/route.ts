import { NextResponse } from "next/server";
import { normalizeEmail, verifyStoredOtp } from "@/lib/otp";
import {
  enforceRateLimits,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { otpVerifySchema } from "@/schemas/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = otpVerifySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input data", issues: validation.error.issues },
        { status: 400 }
      );
    }

    const email = normalizeEmail(validation.data.email);
    const { purpose, code } = validation.data;

    const ip = getClientIp(request);
    const limited = await enforceRateLimits([
      { key: `otp-verify:ip:${ip}`, limit: 30, windowSec: 15 * 60 },
      { key: `otp-verify:email:${email}`, limit: 15, windowSec: 15 * 60 },
    ]);
    if (limited) {
      return rateLimitResponse(limited, "Too many verification attempts.");
    }

    const result = await verifyStoredOtp(email, purpose, code);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      message: "Email verified",
      signupToken: result.signupToken,
    });
  } catch (error) {
    console.error("[OTP_VERIFY]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
