import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { MobileAuthError, rotateMobileSession } from "@/lib/mobile-auth";

const refreshSchema = z.object({
  refreshToken: z.string().min(20),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = refreshSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const rotated = await rotateMobileSession(parsed.data.refreshToken);

    return NextResponse.json({
      accessToken: rotated.accessToken,
      refreshToken: rotated.refreshToken,
      expiresIn: rotated.expiresIn,
      tokenType: "Bearer",
      user: rotated.user,
    });
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    console.error("[MOBILE_REFRESH]", error);
    return NextResponse.json(
      { error: "Refresh failed", code: "REFRESH_FAILED" },
      { status: 500 }
    );
  }
}
