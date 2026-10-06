"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { agentApplySchema, AgentApplyFormValues } from "@/schemas/agent";
import { Loader2 } from "lucide-react";

export default function JoinAsAgentPage() {
  const router = useRouter();
  const { status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AgentApplyFormValues>({
    resolver: zodResolver(agentApplySchema),
    defaultValues: {
      name: "",
      businessName: "",
      location: "",
      email: "",
      phoneNumber: "",
      businessAddress: "",
      password: "",
    },
  });

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  const onSubmit = async (data: AgentApplyFormValues) => {
    try {
      setLoading(true);
      setError(null);
      await axios.post("/api/agents/apply", data);
      setSuccess(true);
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center bg-muted/30 px-4 py-12">
        <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <h1 className="font-serif text-3xl font-semibold text-foreground">
            Application received
          </h1>
          <p className="mt-4 text-muted-foreground">
            Thank you for applying to join the Manzil agent network. Our team will
            review your details. Once approved, you will receive an activation email
            and can sign in to your agent account.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] bg-muted/30 px-4 py-12">
      <div className="mx-auto grid w-full max-w-5xl gap-10 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-6 lg:pt-8">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            Manzil partner program
          </p>
          <h1 className="font-serif text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            Join our team as an agent
          </h1>
          <p className="text-lg text-muted-foreground">
            Exclusive benefits, access to unlimited clients and properties, and a
            community you can rely on — while you remain the owner of your own
            business.
          </p>
          <ul className="space-y-3 text-sm text-foreground/90">
            <li>Build a public Agent Trust Profile — not vanity stars</li>
            <li>Earn commission supporting verifications and closing deals</li>
            <li>Bring clients through Manzil and grow with Golden Agent rewards</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold text-foreground">Agent application</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tell us about you and your business. Access unlocks after verification.
          </p>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={errors.name?.message}>
                <input
                  {...register("name")}
                  className={inputClass(!!errors.name)}
                  placeholder="Your name"
                />
              </Field>
              <Field label="Business name" error={errors.businessName?.message}>
                <input
                  {...register("businessName")}
                  className={inputClass(!!errors.businessName)}
                  placeholder="Agency / office name"
                />
              </Field>
            </div>

            <Field label="Location" error={errors.location?.message}>
              <input
                {...register("location")}
                className={inputClass(!!errors.location)}
                placeholder="City / area"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" error={errors.email?.message}>
                <input
                  type="email"
                  {...register("email")}
                  className={inputClass(!!errors.email)}
                  placeholder="you@agency.com"
                />
              </Field>
              <Field label="Phone" error={errors.phoneNumber?.message}>
                <input
                  {...register("phoneNumber")}
                  className={inputClass(!!errors.phoneNumber)}
                  placeholder="03XXXXXXXXX"
                />
              </Field>
            </div>

            <Field label="Business address" error={errors.businessAddress?.message}>
              <textarea
                {...register("businessAddress")}
                rows={2}
                className={inputClass(!!errors.businessAddress)}
                placeholder="Office street address"
              />
            </Field>

            <Field label="Password" error={errors.password?.message}>
              <input
                type="password"
                {...register("password")}
                className={inputClass(!!errors.password)}
                placeholder="Create a password"
                autoComplete="new-password"
              />
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit application"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already an agent?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground">{label}</label>
      {children}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

function inputClass(hasError: boolean) {
  return `w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 ${
    hasError ? "border-red-300" : "border-input"
  }`;
}
