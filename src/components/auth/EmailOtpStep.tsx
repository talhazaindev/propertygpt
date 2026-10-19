"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Loader2 } from "lucide-react";

type OtpPurpose = "SIGNUP" | "AGENT_SIGNUP";

type EmailOtpStepProps = {
  email: string;
  purpose: OtpPurpose;
  onVerified: (signupToken: string) => void;
  onBack: () => void;
  autoSend?: boolean;
};

export function EmailOtpStep({
  email,
  purpose,
  onVerified,
  onBack,
  autoSend = true,
}: EmailOtpStepProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!autoSend) return;
    void sendCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- send once on mount for this email
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const sendCode = async () => {
    try {
      setSending(true);
      setError(null);
      setInfo(null);
      await axios.post("/api/auth/otp/send", { email, purpose });
      setInfo(`We sent a 6-digit code to ${email}`);
      setCooldown(60);
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to send verification code";
      const retry =
        axios.isAxiosError(err) && err.response?.data?.retryAfterSeconds
          ? Number(err.response.data.retryAfterSeconds)
          : 0;
      setError(message);
      if (retry > 0) setCooldown(retry);
    } finally {
      setSending(false);
    }
  };

  const verifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setVerifying(true);
      setError(null);
      const { data } = await axios.post("/api/auth/otp/verify", {
        email,
        purpose,
        code: code.trim(),
      });
      onVerified(data.signupToken);
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Verification failed";
      setError(message);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Verify your email</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the 6-digit code we sent to <span className="font-medium text-foreground">{email}</span>
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {info && !error && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {info}
        </div>
      )}

      <form className="space-y-4" onSubmit={verifyCode}>
        <div>
          <label htmlFor="otp" className="block text-sm font-medium text-foreground">
            Verification code
          </label>
          <input
            id="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="mt-1.5 w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-center text-lg tracking-[0.4em] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="000000"
            required
          />
        </div>

        <button
          type="submit"
          disabled={verifying || code.length !== 6}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {verifying ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify email"
          )}
        </button>
      </form>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={onBack}
          className="font-medium text-muted-foreground hover:text-foreground"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => void sendCode()}
          disabled={sending || cooldown > 0}
          className="font-medium text-primary hover:underline disabled:opacity-50 disabled:no-underline"
        >
          {sending
            ? "Sending..."
            : cooldown > 0
              ? `Resend in ${cooldown}s`
              : "Resend code"}
        </button>
      </div>
    </div>
  );
}
