/**
 * Client helpers for messaging API calls.
 * Staff access uses the NextAuth session cookie (credentials: include).
 * Spoofable admin headers are not used.
 */

export function getStoredAdminUser(): {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
} | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("adminUser");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * @deprecated Header-based admin auth removed. Kept as no-op for call-site compatibility.
 */
export function getAdminMessagingHeaders(): null {
  return null;
}

export async function messagingFetch(
  input: string,
  init: RequestInit = {},
  _asAdmin = false
): Promise<Response> {
  const headers = new Headers(init.headers || {});
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(input, {
    ...init,
    headers,
    credentials: "include",
  });
}
