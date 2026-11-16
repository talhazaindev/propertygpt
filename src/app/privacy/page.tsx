import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Manzil",
  description: "How Manzil by AlWahabCo collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 text-slate-800">
      <p className="text-sm font-medium uppercase tracking-wide text-emerald-800">
        Manzil by AlWahabCo
      </p>
      <h1 className="mt-2 font-serif text-4xl text-slate-900">Privacy Policy</h1>
      <p className="mt-4 text-sm text-slate-500">Last updated: 16 November 2026</p>

      <div className="mt-10 space-y-6 text-base leading-7">
        <p>
          This Privacy Policy explains how Manzil (&quot;we&quot;, &quot;us&quot;)
          handles personal information when you use our website and mobile apps.
          Replace this draft with counsel-reviewed copy before store submission.
        </p>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">What we collect</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Account details such as name, email, and phone number</li>
            <li>Listing content you submit, including photos and ownership documents</li>
            <li>Support messages and property requests</li>
            <li>Basic device and usage diagnostics (when crash reporting is enabled)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">How we use data</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>To create and secure your account</li>
            <li>To verify and publish listings</li>
            <li>To respond to requests and support conversations</li>
            <li>To improve reliability and prevent abuse</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">
            Verification documents
          </h2>
          <p className="mt-2">
            Ownership and identity documents uploaded for listing verification are
            treated as sensitive. Access is restricted to authenticated owners and
            authorized Manzil staff via signed, time-limited downloads — not public
            URLs.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">Mobile tokens</h2>
          <p className="mt-2">
            The Manzil mobile app stores session tokens in the device secure
            enclave (Keychain / Keystore). Tokens are not written to analytics or
            crash breadcrumbs.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">Your choices</h2>
          <p className="mt-2">
            Contact us to request access, correction, or deletion of your account
            data. Account deletion requests for store compliance should be sent to{" "}
            <a className="text-emerald-800 underline" href="mailto:support@alwahabco.pk">
              support@alwahabco.pk
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">Contact</h2>
          <p className="mt-2">
            AlWahabCo — Manzil privacy inquiries:{" "}
            <a className="text-emerald-800 underline" href="mailto:support@alwahabco.pk">
              support@alwahabco.pk
            </a>
          </p>
        </section>
      </div>

      <p className="mt-12 text-sm text-slate-500">
        <Link href="/terms" className="text-emerald-800 underline">
          Terms of Service
        </Link>
        {" · "}
        <Link href="/" className="text-emerald-800 underline">
          Back to Manzil
        </Link>
      </p>
    </div>
  );
}
