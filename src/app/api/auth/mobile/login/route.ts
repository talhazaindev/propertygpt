import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  MobileAuthError,
  authenticateMobilePassword,
  createMobileSession,
  toPublicUser,
} from "@/lib/mobile-auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  deviceName: z.string().max(120).optional(),
  platform: z.enum(["ios", "android", "web", "unknown"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", code: "VALIDATION_ERROR", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { user } = await authenticateMobilePassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    const tokens = await createMobileSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      deviceName: parsed.data.deviceName,
      platform: parsed.data.platform || "unknown",
    });

    return NextResponse.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      tokenType: "Bearer",
      user: toPublicUser(user),
    });
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    console.error("[MOBILE_LOGIN]", error);
    return NextResponse.json(
      { error: "Login failed", code: "LOGIN_FAILED" },
      { status: 500 }
    );
  }
}
