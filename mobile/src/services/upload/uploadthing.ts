/**
 * UploadThing Expo helpers — Bearer-authenticated against the Next.js API.
 */

import { generateReactNativeHelpers } from "@uploadthing/expo";
import { API_BASE_URL } from "@/src/config/env";
import { getAccessToken } from "@/src/services/storage/secureStore";

/** Minimal router shape matching propertygpt/src/app/api/uploadthing/core.ts */
type MobileFileRouter = {
  propertyImages: unknown;
  verificationDocuments: unknown;
  messageAttachments: unknown;
};

export const { useImageUploader, useDocumentUploader, uploadFiles } =
  generateReactNativeHelpers<MobileFileRouter>({
    url: `${API_BASE_URL}/api/uploadthing`,
    fetch: async (input, init) => {
      const token = await getAccessToken();
      const headers = new Headers(init?.headers);
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return fetch(input, {
        ...init,
        headers,
      });
    },
  });

export type MediaKind = "image" | "video";

export type UploadedMedia = {
  url: string;
  key?: string;
  name: string;
  kind: MediaKind;
};

export function detectMediaKind(input: {
  url?: string;
  name?: string;
  type?: string;
}): MediaKind {
  const type = (input.type || "").toLowerCase();
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("image/")) return "image";

  const name = `${input.name || ""} ${input.url || ""}`.toLowerCase();
  if (/\.(mp4|mov|m4v|webm|avi)(\?|$)/.test(name)) return "video";
  return "image";
}

export function isVideoUrl(url: string): boolean {
  return detectMediaKind({ url }) === "video";
}

const ALLOWED_MEDIA_HOSTS = new Set(["utfs.io"]);
const ALLOWED_MEDIA_HOST_SUFFIXES = [".ufs.sh"] as const;

/** Only open https UploadThing hosts externally. */
export function isSafeExternalMediaUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    if (ALLOWED_MEDIA_HOSTS.has(host)) return true;
    return ALLOWED_MEDIA_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix));
  } catch {
    return false;
  }
}
