import { Platform } from "react-native";
import { apiClient, getApiErrorMessage } from "@/src/services/api/client";
import {
  clearTokens,
  getRefreshToken,
  setTokens,
} from "@/src/services/storage/secureStore";
import type { MobileLoginResponse, MobileUser } from "@/src/types/auth";

export async function loginWithPassword(input: {
  email: string;
  password: string;
}): Promise<MobileLoginResponse> {
  const { data } = await apiClient.post<MobileLoginResponse>(
    "/api/auth/mobile/login",
    {
      email: input.email.trim().toLowerCase(),
      password: input.password,
      platform:
        Platform.OS === "ios" || Platform.OS === "android" ? Platform.OS : "unknown",
      deviceName: Platform.OS,
    }
  );

  await setTokens({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });

  return data;
}

export async function sendSignupOtp(email: string): Promise<{ expiresInMinutes: number }> {
  const { data } = await apiClient.post<{
    message: string;
    expiresInMinutes: number;
  }>("/api/auth/otp/send", {
    email: email.trim().toLowerCase(),
    purpose: "SIGNUP",
  });
  return { expiresInMinutes: data.expiresInMinutes };
}

export async function verifySignupOtp(input: {
  email: string;
  code: string;
}): Promise<{ signupToken: string }> {
  const { data } = await apiClient.post<{
    message: string;
    signupToken: string;
  }>("/api/auth/otp/verify", {
    email: input.email.trim().toLowerCase(),
    purpose: "SIGNUP",
    code: input.code.trim(),
  });
  return { signupToken: data.signupToken };
}

export async function registerAccount(input: {
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
  signupToken: string;
}): Promise<void> {
  await apiClient.post("/api/register", {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
    phoneNumber: input.phoneNumber?.trim() || undefined,
    signupToken: input.signupToken,
  });
}

export async function fetchMe(): Promise<MobileUser> {
  const { data } = await apiClient.get<MobileUser>("/api/me");
  return data;
}

export async function logoutCurrentSession(): Promise<void> {
  const refreshToken = await getRefreshToken();
  try {
    await apiClient.post("/api/auth/mobile/logout", {
      refreshToken: refreshToken || undefined,
    });
  } catch (error) {
    console.warn("[auth] logout request failed:", getApiErrorMessage(error));
  } finally {
    await clearTokens();
  }
}
