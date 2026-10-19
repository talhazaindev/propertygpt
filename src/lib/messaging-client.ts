/**
 * Client helpers for messaging API calls (user session or admin headers).
 */

export type AdminAuthHeaders = {
  "x-admin-auth": string;
  "x-admin-email": string;
};

export function getAdminMessagingHeaders(): AdminAuthHeaders | null {
  if (typeof window === "undefined") return null;
  const isAdmin = localStorage.getItem("isAdmin") === "true";
  const raw = localStorage.getItem("adminUser");
  if (!isAdmin || !raw) return null;
  try {
    const user = JSON.parse(raw) as { email?: string; role?: string };
    if (!user.email) return null;
    if (user.role !== "SUPER_ADMIN" && user.role !== "CUSTOMER_SUPPORT") {
      return null;
    }
    return {
      "x-admin-auth": "true",
      "x-admin-email": user.email,
    };
  } catch {
    return null;
  }
}

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

export async function messagingFetch(
  input: string,
  init: RequestInit = {},
  asAdmin = false
): Promise<Response> {
  const headers = new Headers(init.headers || {});
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (asAdmin) {
    const adminHeaders = getAdminMessagingHeaders();
    if (!adminHeaders) {
      throw new Error("Admin messaging access required");
    }
    headers.set("x-admin-auth", adminHeaders["x-admin-auth"]);
    headers.set("x-admin-email", adminHeaders["x-admin-email"]);
  }
  return fetch(input, { ...init, headers });
}
