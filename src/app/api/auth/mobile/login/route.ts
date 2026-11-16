import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  MobileAuthError,
  authenticateMobilePassword,
  createMobileSession,
  toPublicUser,
} from "@/lib/mobile-auth";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  deviceName: z.string().trim().max(120).optional(),
  platform: z
    .string()
    .optional()
    .transform((value) => {
      const normalized = (value || "unknown").trim().toLowerCase();
      if (
        normalized === "ios" ||
        normalized === "android" ||
        normalized === "web"
      ) {
        return normalized;
      }
      return "unknown" as const;
    }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message || "Invalid request";
      return NextResponse.json(
        {
          error: first,
          message: first,
          code: "VALIDATION_ERROR",
          details: parsed.error.issues,
        },
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
