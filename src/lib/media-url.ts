/**
 * Normalize and validate media paths for API responses and listing creates.
 */

/** Hosts allowed for listing / document CDN URLs (UploadThing). */
const ALLOWED_MEDIA_HOST_SUFFIXES = [".ufs.sh"] as const;
const ALLOWED_MEDIA_HOSTS = new Set(["utfs.io"]);

/**
 * True when the value is an https UploadThing URL or a same-origin relative media path.
 * Pure — safe to import from Zod schemas used on the client.
 */
export function isAllowedMediaUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;

  // Legacy local/dev uploads written under public/
  if (
    trimmed.startsWith("/images/") ||
    trimmed.startsWith("/documents/")
  ) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    if (ALLOWED_MEDIA_HOSTS.has(host)) return true;
    return ALLOWED_MEDIA_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix));
  } catch {
    return false;
  }
}

/** Safe to open externally (https + allowlisted host only). */
export function isSafeExternalMediaUrl(value: string): boolean {
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    if (ALLOWED_MEDIA_HOSTS.has(host)) return true;
    return ALLOWED_MEDIA_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix));
  } catch {
    return false;
  }
}

export function absoluteMediaUrl(
  value: string | null | undefined,
  baseUrl?: string
): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    // Drop non-https or non-allowlisted hosts from public payloads.
    return isSafeExternalMediaUrl(trimmed) ? trimmed : null;
  }

  if (
    !trimmed.startsWith("/images/") &&
    !trimmed.startsWith("/documents/")
  ) {
    return null;
  }

  const origin =
    baseUrl ||
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://propertygpt-six.vercel.app";

  return `${origin.replace(/\/$/, "")}${trimmed}`;
}

export function absoluteMediaUrls(
  values: string[] | null | undefined,
  baseUrl?: string
): string[] {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => absoluteMediaUrl(value, baseUrl))
    .filter((value): value is string => Boolean(value));
}
