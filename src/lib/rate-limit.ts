/**
 * Mongo-backed sliding fixed-window rate limiter for auth endpoints.
 * Uses atomic $inc so it works across serverless instances.
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

export type RateLimitResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
};

export type RateLimitOptions = {
  /** Unique bucket key, e.g. `mobile-login:ip:1.2.3.4`. */
  key: string;
  /** Max requests allowed in the window. */
  limit: number;
  /** Window length in seconds. */
  windowSec: number;
};

const COLLECTION = "RateLimitBucket";
let indexReady: Promise<void> | null = null;

async function ensureIndex(): Promise<void> {
  if (!indexReady) {
    indexReady = (async () => {
      const { db } = await connectDB();
      await db.collection(COLLECTION).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
      await db.collection(COLLECTION).createIndex({ key: 1 }, { unique: true });
    })().catch((error) => {
      // Index creation is best-effort; do not block requests if it races.
      console.warn("[RATE_LIMIT] index ensure failed", error);
      indexReady = null;
    });
  }
  await indexReady;
}

/**
 * Consume one unit from the rate-limit bucket.
 */
export async function rateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const { key, limit, windowSec } = options;
  const now = new Date();
  const windowMs = Math.max(1, windowSec) * 1000;
  const expiresAt = new Date(now.getTime() + windowMs);

  await ensureIndex();
  const { db } = await connectDB();
  const col = db.collection(COLLECTION);

  const existing = await col.findOne<{ count: number; expiresAt: Date }>({ key });

  if (!existing || new Date(existing.expiresAt).getTime() <= now.getTime()) {
    await col.updateOne(
      { key },
      {
        $set: { key, count: 1, expiresAt, updatedAt: now },
      },
      { upsert: true }
    );
    return {
      ok: true,
      limit,
      remaining: Math.max(0, limit - 1),
      retryAfterSeconds: windowSec,
    };
  }

  const updated = await col.findOneAndUpdate(
    { key, expiresAt: { $gt: now } },
    { $inc: { count: 1 }, $set: { updatedAt: now } },
    { returnDocument: "after" }
  );

  // Driver 4–6 may return the doc directly or under `.value`.
  const doc =
    updated && typeof updated === "object" && "value" in (updated as object)
      ? (updated as { value?: { count?: number } }).value
      : (updated as { count?: number } | null);

  const count =
    typeof doc?.count === "number" ? doc.count : existing.count + 1;

  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((new Date(existing.expiresAt).getTime() - now.getTime()) / 1000)
  );

  if (count > limit) {
    return {
      ok: false,
      limit,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  return {
    ok: true,
    limit,
    remaining: Math.max(0, limit - count),
    retryAfterSeconds,
  };
}

/** Extract client IP from common proxy headers. */
export function getClientIp(req: Request | NextRequest): string {
  const headers = req.headers;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp.slice(0, 64);
  return "unknown";
}

/** Standard 429 JSON used by auth routes. */
export function rateLimitResponse(result: RateLimitResult, message = "Too many attempts. Try again later.") {
  return NextResponse.json(
    {
      error: message,
      code: "RATE_LIMITED",
      retryAfterSeconds: result.retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
      },
    }
  );
}

/** Require all listed buckets to pass; returns first failure. */
export async function enforceRateLimits(
  checks: RateLimitOptions[]
): Promise<RateLimitResult | null> {
  for (const check of checks) {
    const result = await rateLimit(check);
    if (!result.ok) return result;
  }
  return null;
}
