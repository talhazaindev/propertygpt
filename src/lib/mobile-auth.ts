/**
 * Mobile access/refresh token lifecycle.
 * Access: short-lived JWT signed with MOBILE_JWT_SECRET.
 * Refresh: opaque random token; only a hash is stored server-side.
 */

import { createHash, randomBytes } from "node:crypto";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { compare } from "bcrypt";
import type { Role } from "@prisma/client";
import prisma from "@/lib/prismadb";

export const MOBILE_ACCESS_TTL_SECONDS = 15 * 60;
export const MOBILE_REFRESH_TTL_DAYS = 30;
export const MOBILE_JWT_ISSUER = "manzil";
export const MOBILE_JWT_AUDIENCE = "manzil-mobile";
export const MOBILE_TOKEN_TYPE_ACCESS = "access";

export class MobileAuthError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 401, code = "UNAUTHORIZED") {
    super(message);
    this.name = "MobileAuthError";
    this.status = status;
    this.code = code;
  }
}

export type MobileAccessClaims = {
  sub: string;
  sid: string;
  typ: typeof MOBILE_TOKEN_TYPE_ACCESS;
  role: Role | string;
  email: string;
  name?: string | null;
};

export type AuthenticatedMobileUser = {
  id: string;
  email: string;
  name: string | null;
  role: Role | string;
  phoneNumber: string | null;
  image: string | null;
  sessionId: string;
};

function getMobileJwtSecret(): Uint8Array {
  const secret = process.env.MOBILE_JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new MobileAuthError(
      "MOBILE_JWT_SECRET is not configured",
      500,
      "SERVER_MISCONFIGURED"
    );
  }
  return new TextEncoder().encode(secret);
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateRefreshToken(): string {
  return randomBytes(32).toString("base64url");
}

export function generateFamilyId(): string {
  return randomBytes(16).toString("hex");
}

export async function signMobileAccessToken(input: {
  userId: string;
  sessionId: string;
  email: string;
  role: Role | string;
  name?: string | null;
}): Promise<string> {
  const secret = getMobileJwtSecret();
  return new SignJWT({
    typ: MOBILE_TOKEN_TYPE_ACCESS,
    sid: input.sessionId,
    role: input.role,
    email: input.email,
    name: input.name ?? null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.userId)
    .setIssuer(MOBILE_JWT_ISSUER)
    .setAudience(MOBILE_JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${MOBILE_ACCESS_TTL_SECONDS}s`)
    .sign(secret);
}

export async function verifyMobileAccessToken(
  token: string
): Promise<MobileAccessClaims & JWTPayload> {
  const secret = getMobileJwtSecret();
  const { payload } = await jwtVerify(token, secret, {
    issuer: MOBILE_JWT_ISSUER,
    audience: MOBILE_JWT_AUDIENCE,
  });

  if (payload.typ !== MOBILE_TOKEN_TYPE_ACCESS) {
    throw new MobileAuthError("Invalid token type", 401, "INVALID_TOKEN_TYPE");
  }
  if (!payload.sub || typeof payload.sid !== "string") {
    throw new MobileAuthError("Invalid token claims", 401, "INVALID_TOKEN");
  }

  return payload as MobileAccessClaims & JWTPayload;
}

async function loadPublicUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phoneNumber: true,
      image: true,
      hashedPassword: true,
      agentProfile: { select: { status: true } },
    },
  });
}

export function toPublicUser(user: {
  id: string;
  email: string;
  name: string | null;
  role: Role | string;
  phoneNumber: string | null;
  image: string | null;
  agentProfile?: { status: string } | null;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phoneNumber: user.phoneNumber,
    image: user.image,
    agentStatus: user.agentProfile?.status ?? null,
  };
}

export async function createMobileSession(input: {
  userId: string;
  email: string;
  role: Role | string;
  name?: string | null;
  deviceName?: string | null;
  platform?: string | null;
}): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  sessionId: string;
}> {
  const refreshToken = generateRefreshToken();
  const familyId = generateFamilyId();
  const expiresAt = new Date(
    Date.now() + MOBILE_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000
  );

  const session = await prisma.mobileSession.create({
    data: {
      userId: input.userId,
      familyId,
      refreshTokenHash: hashRefreshToken(refreshToken),
      deviceName: input.deviceName || null,
      platform: input.platform || null,
      expiresAt,
    },
  });

  const accessToken = await signMobileAccessToken({
    userId: input.userId,
    sessionId: session.id,
    email: input.email,
    role: input.role,
    name: input.name,
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: MOBILE_ACCESS_TTL_SECONDS,
    sessionId: session.id,
  };
}

/**
 * Rotate refresh token with reuse detection and race-safe consume.
 */
export async function rotateMobileSession(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: ReturnType<typeof toPublicUser>;
}> {
  const presentedHash = hashRefreshToken(refreshToken);
  const existing = await prisma.mobileSession.findFirst({
    where: { refreshTokenHash: presentedHash },
  });

  if (!existing) {
    throw new MobileAuthError("Invalid refresh token", 401, "INVALID_REFRESH");
  }

  if (existing.revokedAt) {
    // Short grace window: a lost rotate response can present the just-consumed
    // token again. Treat that as a race (retryable) instead of theft revoke.
    const revokedAgeMs = Date.now() - existing.revokedAt.getTime();
    const GRACE_MS = 30_000;
    if (revokedAgeMs <= GRACE_MS) {
      throw new MobileAuthError(
        "Refresh already rotated — retry shortly",
        409,
        "REFRESH_RACE"
      );
    }
    await prisma.mobileSession.updateMany({
      where: { familyId: existing.familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new MobileAuthError(
      "Refresh token reuse detected",
      401,
      "REFRESH_REUSE"
    );
  }

  if (existing.expiresAt.getTime() <= Date.now()) {
    await prisma.mobileSession.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });
    throw new MobileAuthError("Refresh token expired", 401, "REFRESH_EXPIRED");
  }

  const consume = await prisma.mobileSession.updateMany({
    where: { id: existing.id, revokedAt: null },
    data: { revokedAt: new Date(), lastUsedAt: new Date() },
  });

  if (consume.count !== 1) {
    throw new MobileAuthError("Refresh race lost", 409, "REFRESH_RACE");
  }

  const user = await loadPublicUser(existing.userId);
  if (!user) {
    throw new MobileAuthError("User not found", 401, "USER_NOT_FOUND");
  }

  if (user.role === "AGENT") {
    const status = user.agentProfile?.status;
    if (!status || status === "PENDING" || status === "REJECTED" || status === "SUSPENDED") {
      await prisma.mobileSession.updateMany({
        where: { familyId: existing.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new MobileAuthError(
        "Agent account is not active",
        403,
        "AGENT_INACTIVE"
      );
    }
  }

  const nextRefresh = generateRefreshToken();
  const expiresAt = new Date(
    Date.now() + MOBILE_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000
  );

  const nextSession = await prisma.mobileSession.create({
    data: {
      userId: existing.userId,
      familyId: existing.familyId,
      refreshTokenHash: hashRefreshToken(nextRefresh),
      deviceName: existing.deviceName,
      platform: existing.platform,
      expiresAt,
    },
  });

  const accessToken = await signMobileAccessToken({
    userId: user.id,
    sessionId: nextSession.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });

  return {
    accessToken,
    refreshToken: nextRefresh,
    expiresIn: MOBILE_ACCESS_TTL_SECONDS,
    user: toPublicUser(user),
  };
}

export async function revokeMobileSession(input: {
  sessionId?: string;
  refreshToken?: string;
  userId?: string;
}): Promise<void> {
  if (input.refreshToken) {
    const hash = hashRefreshToken(input.refreshToken);
    await prisma.mobileSession.updateMany({
      where: { refreshTokenHash: hash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return;
  }

  if (input.sessionId) {
    await prisma.mobileSession.updateMany({
      where: {
        id: input.sessionId,
        ...(input.userId ? { userId: input.userId } : {}),
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }
}

export async function revokeAllMobileSessions(userId: string): Promise<number> {
  const result = await prisma.mobileSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return result.count;
}

export async function authenticateMobilePassword(input: {
  email: string;
  password: string;
}): Promise<{
  user: NonNullable<Awaited<ReturnType<typeof loadPublicUser>>>;
}> {
  const email = input.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phoneNumber: true,
      image: true,
      hashedPassword: true,
      agentProfile: { select: { status: true } },
    },
  });

  if (!user?.hashedPassword) {
    throw new MobileAuthError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  const valid = await compare(input.password, user.hashedPassword);
  if (!valid) {
    throw new MobileAuthError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  if (user.role === "AGENT") {
    const status = user.agentProfile?.status;
    if (!status || status === "PENDING") {
      throw new MobileAuthError(
        "Your agent account is pending approval.",
        403,
        "AGENT_PENDING"
      );
    }
    if (status === "REJECTED") {
      throw new MobileAuthError(
        "Your agent application was not approved.",
        403,
        "AGENT_REJECTED"
      );
    }
    if (status === "SUSPENDED") {
      throw new MobileAuthError(
        "Your agent account has been suspended.",
        403,
        "AGENT_SUSPENDED"
      );
    }
  }

  return { user };
}

export async function resolveMobileUserFromAccessToken(
  token: string
): Promise<AuthenticatedMobileUser> {
  const claims = await verifyMobileAccessToken(token);

  const session = await prisma.mobileSession.findUnique({
    where: { id: String(claims.sid) },
  });

  if (!session || session.revokedAt || session.userId !== claims.sub) {
    throw new MobileAuthError("Session revoked or invalid", 401, "SESSION_INVALID");
  }

  const user = await loadPublicUser(claims.sub);
  if (!user) {
    throw new MobileAuthError("User not found", 401, "USER_NOT_FOUND");
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phoneNumber: user.phoneNumber,
    image: user.image,
    sessionId: session.id,
  };
}
