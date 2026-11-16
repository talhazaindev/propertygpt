/**
 * Authorization and signed access for private verification documents.
 * Public APIs must never expose durable document URLs.
 */

import { createHash, timingSafeEqual } from "node:crypto";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prismadb";
import { resolveStaffActor } from "@/lib/staff-auth";
import { utapi } from "@/lib/utapi";

export const VERIFICATION_SIGNED_URL_TTL_SECONDS = 120;

export type VerificationDocRecord = {
  type?: string;
  url?: string;
  fileName?: string;
  uploadedAt?: string | Date;
  fileKey?: string;
  key?: string;
};

export type SafeVerificationDoc = {
  id: string;
  type: string;
  fileName: string;
  uploadedAt: string | null;
  downloadPath: string;
};

type PropertyAccessContext = {
  id: string;
  ownerId?: string | null;
  assignedAgentId?: string | null;
};

/**
 * Extract an UploadThing file key from a stored URL or key field.
 */
export function extractUploadThingFileKey(
  doc: VerificationDocRecord
): string | null {
  if (typeof doc.fileKey === "string" && doc.fileKey.trim()) {
    return doc.fileKey.trim();
  }
  if (typeof doc.key === "string" && doc.key.trim()) {
    return doc.key.trim();
  }
  if (typeof doc.url !== "string" || !doc.url.trim()) {
    return null;
  }

  try {
    const raw = doc.url.trim();
    if (raw.startsWith("/f/")) {
      return raw.slice(3).split("?")[0] || null;
    }
    const url = new URL(raw, "https://example.invalid");
    const match = url.pathname.match(/\/f\/([^/]+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function verificationDocId(
  propertyId: string,
  index: number,
  doc: VerificationDocRecord
): string {
  const key = extractUploadThingFileKey(doc) || doc.url || String(index);
  return createHash("sha256")
    .update(`${propertyId}:${index}:${key}`)
    .digest("hex")
    .slice(0, 24);
}

export async function canAccessVerificationDocuments(
  property: PropertyAccessContext,
  session?: Session | null
): Promise<boolean> {
  const activeSession = session ?? (await getServerSession(authOptions));
  if (!activeSession?.user?.id) {
    return false;
  }

  const staff = await resolveStaffActor();
  if (staff) {
    return true;
  }

  if (property.ownerId && activeSession.user.id === String(property.ownerId)) {
    return true;
  }

  if (
    property.assignedAgentId &&
    activeSession.user.id === String(property.assignedAgentId) &&
    activeSession.user.role === "AGENT"
  ) {
    const profile = await prisma.agentProfile.findUnique({
      where: { userId: activeSession.user.id },
      select: { status: true },
    });
    return profile?.status === "ACTIVE";
  }

  return false;
}

export function toSafeVerificationDocuments(
  propertyId: string,
  docs: unknown
): SafeVerificationDoc[] {
  if (!Array.isArray(docs)) {
    return [];
  }

  return docs.map((raw, index) => {
    const doc = (raw || {}) as VerificationDocRecord;
    return {
      id: verificationDocId(propertyId, index, doc),
      type: typeof doc.type === "string" ? doc.type : "UNKNOWN",
      fileName:
        typeof doc.fileName === "string" && doc.fileName
          ? doc.fileName
          : `document-${index + 1}`,
      uploadedAt: doc.uploadedAt ? new Date(doc.uploadedAt).toISOString() : null,
      downloadPath: `/api/properties/${propertyId}/verification-documents/${verificationDocId(
        propertyId,
        index,
        doc
      )}`,
    };
  });
}

export async function createSignedDownloadUrl(
  doc: VerificationDocRecord
): Promise<string | null> {
  const fileKey = extractUploadThingFileKey(doc);
  if (!fileKey) {
    // Local/dev relative path — only usable by authorized server-side proxy later
    if (typeof doc.url === "string" && doc.url.startsWith("/")) {
      return doc.url;
    }
    return null;
  }

  try {
    const signed = await utapi.generateSignedURL(fileKey, {
      expiresIn: VERIFICATION_SIGNED_URL_TTL_SECONDS,
    });
    return signed.ufsUrl;
  } catch (error) {
    console.error("[VERIFICATION_SIGNED_URL]", error);
    return null;
  }
}

export function findVerificationDocument(
  propertyId: string,
  docs: unknown,
  docId: string
): VerificationDocRecord | null {
  if (!Array.isArray(docs)) {
    return null;
  }

  for (let index = 0; index < docs.length; index += 1) {
    const doc = (docs[index] || {}) as VerificationDocRecord;
    if (verificationDocId(propertyId, index, doc) === docId) {
      return doc;
    }
  }
  return null;
}

/**
 * Constant-time compare for optional future token checks.
 */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}
