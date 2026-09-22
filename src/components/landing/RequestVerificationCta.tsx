"use client";

import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";

export function RequestVerificationCta() {
  const router = useRouter();
  const [contact, setContact] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = contact.trim();
    const params = new URLSearchParams();
    if (trimmed) {
      if (trimmed.includes("@")) {
        params.set("email", trimmed);
      } else {
        params.set("phone", trimmed);
      }
    }
    const qs = params.toString();
    router.push(qs ? `/request-property?${qs}` : "/request-property");
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-stretch">
      <label className="sr-only" htmlFor="cta-contact">
        Phone or email
      </label>
      <input
        id="cta-contact"
        type="text"
        required
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        placeholder="Your phone number or email"
        className="h-12 flex-1 rounded-lg border border-border bg-card px-4 text-sm text-foreground outline-none ring-primary placeholder:text-muted-foreground focus:ring-2"
      />
      <button
        type="submit"
        className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Request Verification
      </button>
    </form>
  );
}
