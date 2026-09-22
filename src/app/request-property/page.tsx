import { Metadata } from "next";
import { Suspense } from "react";
import { PropertyRequestForm } from "@/components/request/PropertyRequestForm";

export const metadata: Metadata = {
  title: "Request Verification | Manzil By AlWahabCo",
  description:
    "Tell us what you're looking for, or share a property you're considering. Our team will run the full verification.",
};

export default function RequestProperty() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Request Verification
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Can&apos;t find what you&apos;re looking for? Share your requirements and we&apos;ll help
          you find a properly verified property.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <Suspense fallback={<div className="py-8 text-center text-sm text-muted-foreground">Loading form…</div>}>
          <PropertyRequestForm />
        </Suspense>
      </div>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>
          Our team will review your request and get back to you within 48 hours. For immediate
          assistance, contact{" "}
          <a href="mailto:hello@manzil.pk" className="font-medium text-primary hover:underline">
            hello@manzil.pk
          </a>
        </p>
      </div>
    </div>
  );
}
