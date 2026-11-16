import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Manzil",
  description: "Terms governing use of Manzil by AlWahabCo.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 text-slate-800">
      <p className="text-sm font-medium uppercase tracking-wide text-emerald-800">
        Manzil by AlWahabCo
      </p>
      <h1 className="mt-2 font-serif text-4xl text-slate-900">Terms of Service</h1>
      <p className="mt-4 text-sm text-slate-500">Last updated: 16 November 2026</p>

      <div className="mt-10 space-y-6 text-base leading-7">
        <p>
          These Terms govern your use of Manzil websites and mobile apps operated
          by AlWahabCo. Replace this draft with counsel-reviewed copy before store
          submission.
        </p>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">The service</h2>
          <p className="mt-2">
            Manzil helps buyers, renters, and sellers discover and list verified
            property in Pakistan. Verification reduces risk; it is not a legal
            guarantee of title, valuation, or transaction outcome.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">Accounts</h2>
          <p className="mt-2">
            You must provide accurate registration information and keep your
            credentials secure. You are responsible for activity under your
            account.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">Listings</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Only submit properties you are authorized to list</li>
            <li>Provide genuine ownership documents for verification</li>
            <li>Do not upload forged, misleading, or illegal content</li>
            <li>Manzil may reject, unpublish, or remove listings</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">Acceptable use</h2>
          <p className="mt-2">
            Do not attempt unauthorized access, scrape personal data, abuse
            messaging, or interfere with verification workflows. Admin tools are
            not available in the consumer mobile app.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">Liability</h2>
          <p className="mt-2">
            Manzil is provided on an as-available basis. To the extent permitted by
            law, AlWahabCo is not liable for indirect damages arising from listing
            accuracy, third-party communications, or offline transactions.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">Contact</h2>
          <p className="mt-2">
            Questions about these Terms:{" "}
            <a className="text-emerald-800 underline" href="mailto:support@alwahabco.pk">
              support@alwahabco.pk
            </a>
          </p>
        </section>
      </div>

      <p className="mt-12 text-sm text-slate-500">
        <Link href="/privacy" className="text-emerald-800 underline">
          Privacy Policy
        </Link>
        {" · "}
        <Link href="/" className="text-emerald-800 underline">
          Back to Manzil
        </Link>
      </p>
    </div>
  );
}
