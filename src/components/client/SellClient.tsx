"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import PropertyForm from "@/components/property/PropertyForm";

export default function SellClient() {
  const { status } = useSession();

  if (status === "authenticated") {
    return <PropertyForm />;
  }

  // Show sign-in CTA immediately — do not block the page on session fetch
  return (
    <div className="mx-auto max-w-4xl rounded-xl border border-border bg-card p-6 shadow-sm md:p-8">
      <p className="text-center text-muted-foreground">
        {status === "loading"
          ? "Checking your session…"
          : "Please sign in to list your property for sale."}
      </p>

      <div className="mt-6 flex justify-center">
        <Link
          href="/login?callbackUrl=/sell"
          className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Sign In to Continue
        </Link>
      </div>
    </div>
  );
}
