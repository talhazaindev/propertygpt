/**
 * Unified auth for protected API routes.
 * Bearer-first: if Authorization is present, it must be a valid mobile access token.
 * Cookie session is used only when no Authorization header is supplied.
 */

import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import {
  MobileAuthError,
  resolveMobileUserFromAccessToken,
  type AuthenticatedMobileUser,
} from "@/lib/mobile-auth";

export type AuthActor =
  | {
      kind: "mobile";
      userId: string;
      email: string;
      name: string | null;
      role: string;
      phoneNumber: string | null;
      image: string | null;
      sessionId: string;
      isTeamMember: false;
    }
  | {
      kind: "web";
      userId: string;
      email: string;
      name: string | null;
      role: string;
      isTeamMember: boolean;
      phoneNumber?: null;
      image?: null;
      sessionId?: null;
    };

export class AuthError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 401, code = "UNAUTHORIZED") {
    super(message);
    this.name = "AuthError";
    this.status = status;
    this.code = code;
  }
}

function getBearerToken(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) {
    throw new AuthError("Malformed Authorization header", 401, "MALFORMED_AUTH");
  }
  return token.trim();
}

export async function requireAuth(req: Request): Promise<AuthActor> {
  const bearer = getBearerToken(req);

  if (bearer) {
    try {
      const user: AuthenticatedMobileUser =
        await resolveMobileUserFromAccessToken(bearer);
      return {
        kind: "mobile",
        userId: user.id,
        email: user.email,
        name: user.name,
        role: String(user.role),
        phoneNumber: user.phoneNumber,
        image: user.image,
        sessionId: user.sessionId,
        isTeamMember: false,
      };
    } catch (error) {
      if (error instanceof MobileAuthError) {
        throw new AuthError(error.message, error.status, error.code);
      }
      throw new AuthError("Invalid access token", 401, "INVALID_ACCESS_TOKEN");
    }
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new AuthError("Unauthorized", 401, "UNAUTHORIZED");
  }

  return {
    kind: "web",
    userId: session.user.id,
    email: session.user.email || "",
    name: session.user.name || null,
    role: String(session.user.role || ""),
    isTeamMember: Boolean(session.user.isTeamMember),
  };
}

export async function optionalAuth(req: Request): Promise<AuthActor | null> {
  try {
    return await requireAuth(req);
  } catch (error) {
    if (error instanceof AuthError && error.code === "MALFORMED_AUTH") {
      throw error;
    }
    // If Bearer was present but invalid, requireAuth already threw — rethrow.
    const header = req.headers.get("authorization");
    if (header) {
      throw error;
    }
    return null;
  }
}

export function authErrorResponse(error: unknown): NextResponse {
  if (error instanceof AuthError || error instanceof MobileAuthError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status }
    );
  }
  return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
}
