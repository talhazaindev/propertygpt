/**
 * Normalize media paths to absolute HTTPS URLs for mobile clients.
 */

export function absoluteMediaUrl(
  value: string | null | undefined,
  baseUrl?: string
): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const origin =
    baseUrl ||
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://propertygpt-six.vercel.app";

  if (trimmed.startsWith("/")) {
    return `${origin.replace(/\/$/, "")}${trimmed}`;
  }

  return `${origin.replace(/\/$/, "")}/${trimmed}`;
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
