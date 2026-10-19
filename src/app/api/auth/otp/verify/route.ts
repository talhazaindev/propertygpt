import { NextResponse } from "next/server";
import { normalizeEmail, verifyStoredOtp } from "@/lib/otp";
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
