import { Platform } from "react-native";
import { apiClient } from "@/src/services/api/client";
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
  const platform =
    Platform.OS === "ios" || Platform.OS === "android" ? Platform.OS : "unknown";

  const { data } = await apiClient.post<MobileLoginResponse>(
    "/api/auth/mobile/login",
    {
      email: input.email.trim().toLowerCase(),
      password: input.password,
      platform,
      deviceName: `${platform}-expo`,
    }
  );

  await setTokens({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });

  return data;
}

export async function sendOtp(input: {
  email: string;
  purpose: "SIGNUP" | "PASSWORD_RESET";
}): Promise<{ expiresInMinutes: number }> {
  const { data } = await apiClient.post<{
    message: string;
    expiresInMinutes: number;
  }>("/api/auth/otp/send", {
    email: input.email.trim().toLowerCase(),
    purpose: input.purpose,
  });
  return { expiresInMinutes: data.expiresInMinutes ?? 10 };
}

export async function sendSignupOtp(email: string): Promise<{ expiresInMinutes: number }> {
  return sendOtp({ email, purpose: "SIGNUP" });
}

export async function sendResetOtp(email: string): Promise<{ expiresInMinutes: number }> {
  return sendOtp({ email, purpose: "PASSWORD_RESET" });
}

export async function verifyOtp(input: {
  email: string;
  code: string;
  purpose: "SIGNUP" | "PASSWORD_RESET";
}): Promise<{ signupToken: string }> {
  const { data } = await apiClient.post<{
    message: string;
    signupToken: string;
  }>("/api/auth/otp/verify", {
    email: input.email.trim().toLowerCase(),
    purpose: input.purpose,
    code: input.code.trim(),
  });
  return { signupToken: data.signupToken };
}

export async function verifySignupOtp(input: {
  email: string;
  code: string;
}): Promise<{ signupToken: string }> {
  return verifyOtp({ ...input, purpose: "SIGNUP" });
}

export async function verifyResetOtp(input: {
  email: string;
  code: string;
}): Promise<{ resetToken: string }> {
  const result = await verifyOtp({ ...input, purpose: "PASSWORD_RESET" });
  return { resetToken: result.signupToken };
}

export async function resetPassword(input: {
  email: string;
  resetToken: string;
  password: string;
  confirmPassword: string;
}): Promise<void> {
  await apiClient.post("/api/auth/reset-password", {
    email: input.email.trim().toLowerCase(),
    resetToken: input.resetToken,
    password: input.password,
    confirmPassword: input.confirmPassword,
  });
}

export async function deleteAccount(password: string): Promise<void> {
  await apiClient.delete("/api/me", {
    data: { password, confirm: true },
  });
  await clearTokens();
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

export async function updateProfile(input: {
  name?: string;
  phoneNumber?: string;
}): Promise<MobileUser> {
  const { data } = await apiClient.patch<MobileUser>("/api/me", {
    name: input.name?.trim(),
    phoneNumber:
      input.phoneNumber === undefined
        ? undefined
        : input.phoneNumber.trim() || "",
  });
  return data;
}

export async function logoutCurrentSession(): Promise<void> {
  const refreshToken = await getRefreshToken();
  try {
    await apiClient.post("/api/auth/mobile/logout", {
      refreshToken: refreshToken || undefined,
    });
  } catch {
    // Best-effort — always clear local tokens.
  } finally {
    await clearTokens();
  }
}

export async function logoutAllSessions(): Promise<void> {
  try {
    await apiClient.post("/api/auth/mobile/logout", { all: true });
  } catch {
    // Best-effort — always clear local tokens.
  } finally {
    await clearTokens();
  }
}
