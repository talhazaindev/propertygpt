import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL, APP_ENV } from "@/src/config/env";
import { captureApiError } from "@/src/monitoring/sentry";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "@/src/services/storage/secureStore";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

let refreshPromise: Promise<string | null> | null = null;

const AUTH_CLEAR_CODES = new Set([
  "INVALID_REFRESH",
  "REFRESH_REUSE",
  "REFRESH_EXPIRED",
  "USER_NOT_FOUND",
  "AGENT_INACTIVE",
]);

function normalizeApiPath(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url, API_BASE_URL);
    return parsed.pathname.replace(
      /\/[a-f0-9]{24}(?=\/|$)/gi,
      "/:id"
    );
  } catch {
    return url.split("?")[0];
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const { data } = await axios.post(
      `${API_BASE_URL}/api/auth/mobile/refresh`,
      { refreshToken },
      { timeout: 20000 }
    );

    if (!data?.accessToken || !data?.refreshToken) {
      await clearTokens();
      return null;
    }

    await setTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
    return data.accessToken as string;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const code = (error.response?.data as { code?: string } | undefined)?.code;

      if (
        status === 401 ||
        status === 403 ||
        (typeof code === "string" && AUTH_CLEAR_CODES.has(code))
      ) {
        await clearTokens();
        return null;
      }

      return null;
    }

    return null;
  }
}

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const status = error.response?.status;
    const shouldCapture =
      (typeof status === "number" && status >= 500) || !error.response;

    if (shouldCapture) {
      captureApiError(error, {
        path: normalizeApiPath(original?.url),
        method: original?.method,
        status: status ?? null,
        code: error.code || null,
      });
    }

    if (status !== 401 || !original || original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;

    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const nextToken = await refreshPromise;
    if (!nextToken) {
      return Promise.reject(error);
    }

    original.headers.Authorization = `Bearer ${nextToken}`;
    return apiClient(original);
  }
);

export type ApiErrorBody = {
  error?: string;
  message?: string;
  code?: string;
  details?: Array<{ message?: string; path?: Array<string | number> }>;
  issues?: Array<{ message?: string; path?: Array<string | number> }>;
  retryAfterSeconds?: number;
};

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorBody | string | undefined;

    if (typeof data === "string" && data.trim()) {
      const stripped = data.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      // Never surface raw HTML or long stack dumps to users.
      if (stripped.length > 180 || /<!doctype|<\/html/i.test(data)) {
        return fallback;
      }
      return stripped.slice(0, 180);
    }

    if (data && typeof data === "object") {
      if (data.code === "RATE_LIMITED") {
        const wait = data.retryAfterSeconds;
        return wait
          ? `Too many attempts. Try again in ${wait}s.`
          : "Too many attempts. Try again later.";
      }
      const detail =
        data.details?.[0]?.message || data.issues?.[0]?.message;
      if (detail) return detail;
      if (typeof data.error === "string" && data.error.trim()) {
        return data.error;
      }
      if (typeof data.message === "string" && data.message.trim()) {
        return data.message;
      }
    }

    if (!error.response) {
      if (error.code === "ECONNABORTED") {
        return "Request timed out. Try again.";
      }
      return "Cannot reach the server. Check your connection and try again.";
    }

    if (error.response.status === 401) {
      return "Please sign in again.";
    }
    if (error.response.status === 403) {
      return "You do not have permission to do that.";
    }
    if (error.response.status === 404) {
      return "Not found.";
    }
    if (error.response.status === 429) {
      return "Too many attempts. Try again later.";
    }
    if (error.response.status >= 500) {
      return "Server error. Please try again.";
    }

    return APP_ENV === "development"
      ? error.message || fallback
      : fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}
