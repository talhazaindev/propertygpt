import Constants from "expo-constants";

type AppExtra = {
  apiBaseUrl?: string;
  serverOrigin?: string;
  sentryDsn?: string;
  privacyUrl?: string;
  termsUrl?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as AppExtra;

/**
 * API origin for the existing Next.js backend.
 * Override via app.config extra or EXPO_PUBLIC_API_BASE_URL.
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  extra.apiBaseUrl ||
  "https://propertygpt-six.vercel.app";

export const SERVER_ORIGIN =
  process.env.EXPO_PUBLIC_SERVER_ORIGIN ||
  extra.serverOrigin ||
  API_BASE_URL;

export const APP_ENV =
  process.env.EXPO_PUBLIC_APP_ENV || ("development" as string);

export const SENTRY_DSN =
  process.env.EXPO_PUBLIC_SENTRY_DSN || extra.sentryDsn || "";

/** Store-facing legal pages hosted on the web app. */
export const PRIVACY_URL =
  process.env.EXPO_PUBLIC_PRIVACY_URL ||
  extra.privacyUrl ||
  `${SERVER_ORIGIN.replace(/\/$/, "")}/privacy`;

export const TERMS_URL =
  process.env.EXPO_PUBLIC_TERMS_URL ||
  extra.termsUrl ||
  `${SERVER_ORIGIN.replace(/\/$/, "")}/terms`;
