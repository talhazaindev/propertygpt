import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  MobileAuthError,
  revokeAllMobileSessions,
  revokeMobileSession,
} from "@/lib/mobile-auth";
import { AuthError, authErrorResponse, requireAuth } from "@/lib/require-auth";

const logoutSchema = z.object({
  refreshToken: z.string().min(20).optional(),
  all: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = logoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Prefer authenticated access token when present.
    let actorUserId: string | null = null;
    let sessionId: string | null = null;
    try {
      const actor = await requireAuth(req);
      actorUserId = actor.userId;
      sessionId = actor.sessionId || null;
    } catch (error) {
      if (error instanceof AuthError && req.headers.get("authorization")) {
        return authErrorResponse(error);
      }
      // No/invalid cookie alone is fine if refreshToken is provided.
    }

    if (parsed.data.all) {
      if (!actorUserId) {
        return NextResponse.json(
          { error: "Authentication required to logout all sessions", code: "UNAUTHORIZED" },
          { status: 401 }
        );
      }
      const count = await revokeAllMobileSessions(actorUserId);
      return NextResponse.json({ success: true, revoked: count });
    }

    if (parsed.data.refreshToken) {
      await revokeMobileSession({ refreshToken: parsed.data.refreshToken });
      return NextResponse.json({ success: true });
    }

    if (sessionId) {
      await revokeMobileSession({ sessionId, userId: actorUserId || undefined });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "refreshToken or access token required", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof MobileAuthError || error instanceof AuthError) {
      return authErrorResponse(error);
    }
    console.error("[MOBILE_LOGOUT]", error);
    return NextResponse.json(
      { error: "Logout failed", code: "LOGOUT_FAILED" },
      { status: 500 }
    );
  }
}
