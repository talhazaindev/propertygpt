/**
 * Sentry bootstrap for Manzil mobile.
 * Never send access/refresh tokens, Authorization headers, or SecureStore values.
 */

import * as Sentry from "@sentry/react-native";
import axios from "axios";
import { APP_ENV, SENTRY_DSN } from "@/src/config/env";

const SENSITIVE_KEY =
  /(authorization|access.?token|refresh.?token|password|cookie|set-cookie|securestore)/i;

function redactValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEY.test(key)) {
    return "[redacted]";
  }
  if (typeof value === "string") {
    if (/Bearer\s+\S+/i.test(value)) {
      return value.replace(/Bearer\s+\S+/gi, "Bearer [redacted]");
    }
    if (value.split(".").length === 3 && value.length > 24) {
      return "[redacted-jwt]";
    }
  }
  return value;
}

function scrubObject(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      out[key] = scrubObject(value as Record<string, unknown>);
    } else {
      out[key] = redactValue(key, value);
    }
  }
  return out;
}

export function initSentry(): void {
  if (!SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: APP_ENV,
    tracesSampleRate: APP_ENV === "production" ? 0.15 : 0.0,
    enableAutoSessionTracking: true,
    sendDefaultPii: false,
    maxBreadcrumbs: 40,
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.data) {
        breadcrumb.data = scrubObject(
          breadcrumb.data as Record<string, unknown>
        ) as typeof breadcrumb.data;
      }
      if (
        breadcrumb.category === "xhr" ||
        breadcrumb.category === "fetch" ||
        breadcrumb.category === "http"
      ) {
        if (breadcrumb.data) {
          delete (breadcrumb.data as Record<string, unknown>).request_body;
          delete (breadcrumb.data as Record<string, unknown>).Authorization;
          delete (breadcrumb.data as Record<string, unknown>).authorization;
          delete (breadcrumb.data as Record<string, unknown>).data;
        }
      }
      return breadcrumb;
    },
    beforeSend(event) {
      if (event.request?.headers) {
        event.request.headers = scrubObject(
          event.request.headers as Record<string, unknown>
        ) as typeof event.request.headers;
      }
      if (event.request && "data" in event.request) {
        delete (event.request as { data?: unknown }).data;
      }
      if (event.extra) {
        event.extra = scrubObject(event.extra as Record<string, unknown>);
      }
      if (event.contexts) {
        for (const [key, value] of Object.entries(event.contexts)) {
          if (value && typeof value === "object") {
            event.contexts[key] = scrubObject(
              value as Record<string, unknown>
            ) as (typeof event.contexts)[string];
          }
        }
      }
      return event;
    },
  });
}

/**
 * Capture API failures without attaching Axios config (headers/body/tokens).
 */
export function captureApiError(
  error: unknown,
  context?: Record<string, unknown>
): void {
  if (!SENTRY_DSN) return;

  const safeContext = context ? scrubObject(context) : undefined;
  const path =
    typeof safeContext?.path === "string" ? safeContext.path : "unknown";
  const method =
    typeof safeContext?.method === "string"
      ? String(safeContext.method).toUpperCase()
      : "REQ";
  const status =
    typeof safeContext?.status === "number" ? safeContext.status : "na";

  const message = axios.isAxiosError(error)
    ? `API ${method} ${path} failed (${status})`
    : error instanceof Error
      ? error.message
      : "API error";

  // Never pass the raw AxiosError — it embeds Authorization + request data.
  const safeError = new Error(message);
  safeError.name = "ApiError";

  Sentry.withScope((scope) => {
    if (safeContext) {
      scope.setContext("api", safeContext);
    }
    scope.setTag("api.path", path);
    scope.setTag("api.method", method);
    scope.setTag("api.status", String(status));
    scope.setFingerprint(["api-error", method, path, String(status)]);
    Sentry.captureException(safeError);
  });
}

export function setSentryUser(user: { id: string } | null): void {
  if (!SENTRY_DSN) return;
  if (!user) {
    Sentry.setUser(null);
    return;
  }
  // id only — no email/PII
  Sentry.setUser({ id: user.id });
}

export { Sentry };
