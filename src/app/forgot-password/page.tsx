"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Loader2 } from "lucide-react";
import {
  forgotPasswordSchema,
  ForgotPasswordFormValues,
  resetPasswordSchema,
  ResetPasswordFormValues,
} from "@/schemas/auth";
import { EmailOtpStep } from "@/components/auth/EmailOtpStep";

type Step = "email" | "otp" | "password" | "done";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const emailForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const passwordForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
      resetToken: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onEmailSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      setLoading(true);
      setError(null);
      setInfo(null);
      const normalized = data.email.trim().toLowerCase();
      await axios.post("/api/auth/otp/send", {
        email: normalized,
        purpose: "PASSWORD_RESET",
      });
      setEmail(normalized);
      setInfo("If an account exists for this email, we sent a reset code and link.");
      setStep("otp");
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to send reset email";
      const retry =
        axios.isAxiosError(err) && err.response?.data?.retryAfterSeconds
          ? Number(err.response.data.retryAfterSeconds)
          : 0;
      setError(retry > 0 ? `${message}` : message);
    } finally {
      setLoading(false);
    }
  };

  const onOtpVerified = (token: string) => {
    setResetToken(token);
    passwordForm.reset({
      email,
      resetToken: token,
      password: "",
      confirmPassword: "",
    });
    setError(null);
    setStep("password");
  };

  const onPasswordSubmit = async (data: ResetPasswordFormValues) => {
    try {
      setLoading(true);
      setError(null);
      await axios.post("/api/auth/reset-password", {
        email: data.email || email,
        resetToken: data.resetToken || resetToken,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      setStep("done");
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to reset password";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="font-serif text-3xl font-semibold text-foreground">
            {step === "done" ? "Password updated" : "Forgot password"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {step === "done"
              ? "You can now sign in with your new password."
              : "We’ll email you a reset link and a 6-digit code."}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {info && step === "otp" && !error && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {info}
          </div>
        )}

        {step === "email" && (
          <form className="space-y-4" onSubmit={emailForm.handleSubmit(onEmailSubmit)}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...emailForm.register("email")}
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="you@example.com"
              />
              {emailForm.formState.errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {emailForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send reset email"
              )}
            </button>
          </form>
        )}

        {step === "otp" && (
          <EmailOtpStep
            email={email}
            purpose="PASSWORD_RESET"
            autoSend={false}
            onVerified={onOtpVerified}
            onBack={() => {
              setStep("email");
              setError(null);
            }}
          />
        )}

        {step === "password" && (
          <form className="space-y-4" onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
            <input type="hidden" {...passwordForm.register("email")} />
            <input type="hidden" {...passwordForm.register("resetToken")} />
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                New password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                {...passwordForm.register("password")}
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {passwordForm.formState.errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {passwordForm.formState.errors.password.message}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-foreground"
              >
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                {...passwordForm.register("confirmPassword")}
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update password"
              )}
            </button>
          </form>
        )}

        {step === "done" && (
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Back to sign in
          </Link>
        )}

        {step !== "done" && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Remembered your password?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
