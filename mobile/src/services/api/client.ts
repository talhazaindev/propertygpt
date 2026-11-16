import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL } from "@/src/config/env";
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
  } catch {
    await clearTokens();
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

    if (error.response?.status !== 401 || !original || original._retry) {
      if (error.response?.status && error.response.status >= 500) {
        captureApiError(error, {
          url: original?.url,
          method: original?.method,
          status: error.response.status,
        });
      }
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
};

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorBody | string | undefined;

    if (typeof data === "string" && data.trim()) {
      return data.replace(/<[^>]+>/g, " ").trim().slice(0, 180);
    }

    if (data && typeof data === "object") {
      if (data.error || data.message) {
        return data.error || data.message || fallback;
      }
      const detail = data.details?.[0]?.message;
      if (detail) return detail;
    }

    if (!error.response) {
      return `Cannot reach API at ${API_BASE_URL}. Is the backend running?`;
    }

    if (error.response.status === 401) {
      return "Invalid email or password";
    }
    if (error.response.status === 400) {
      return "Invalid login details. Check your email and try again.";
    }

    return error.message || fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}
