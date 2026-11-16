/**
 * Sentry bootstrap for Manzil mobile.
 * Never send access/refresh tokens, Authorization headers, or SecureStore values.
 */

import * as Sentry from "@sentry/react-native";
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

export function captureApiError(
  error: unknown,
  context?: Record<string, unknown>
): void {
  if (!SENTRY_DSN) return;

  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext("api", scrubObject(context));
    }
    if (error instanceof Error) {
      Sentry.captureException(error);
    } else {
      Sentry.captureMessage(String(error));
    }
  });
}

export { Sentry };
