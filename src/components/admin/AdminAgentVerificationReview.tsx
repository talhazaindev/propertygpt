"use client";

import Image from "next/image";
import { FileText, ExternalLink, UserCheck, CheckCircle } from "lucide-react";
import {
  verificationDocumentTypeLabels,
  type VerificationDocumentType,
} from "@/schemas/property";

type Doc = { type: string; url: string; fileName?: string };

function isImageDocument(url: string, fileName?: string): boolean {
  const target = (fileName || url).toLowerCase();
  return (
    target.endsWith(".jpg") ||
    target.endsWith(".jpeg") ||
    target.endsWith(".png") ||
    target.endsWith(".webp")
  );
}

export default function AdminAgentVerificationReview({
  property,
  onVerify,
  verifying,
}: {
  property: {
    agentVerificationStatus?: string | null;
    agentVerificationRemarks?: string | null;
    agentVerificationNotes?: string | null;
    agentVerifiedItems?: string | null;
    agentVerificationSource?: string | null;
    agentVerifiedDocuments?: Doc[] | null;
    agentVerificationSubmittedAt?: string | Date | null;
    assignedAgent?: {
      name?: string | null;
      email?: string;
      agentProfile?: { businessName?: string } | null;
    } | null;
    status?: string;
  };
  onVerify: () => void;
  verifying?: boolean;
}) {
  const submitted = property.agentVerificationStatus === "SUBMITTED";
  const completed = property.agentVerificationStatus === "COMPLETED";
  if (
    !submitted &&
    !completed &&
    property.agentVerificationStatus !== "IN_PROGRESS"
  ) {
    return null;
  }

  const docs = property.agentVerifiedDocuments || [];
  const agentLabel =
    property.assignedAgent?.agentProfile?.businessName ||
    property.assignedAgent?.name ||
    property.assignedAgent?.email ||
    "Assigned agent";

  return (
    <div className="border-t border-indigo-100 bg-indigo-50/50 p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <UserCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Agent verification
              {submitted ? " — awaiting final review" : ""}
              {completed ? " — completed" : ""}
            </h2>
            <p className="text-sm text-slate-600">
              Verified by <strong>{agentLabel}</strong>
              {property.agentVerificationSubmittedAt
                ? ` · ${new Date(
                    property.agentVerificationSubmittedAt
                  ).toLocaleString()}`
                : ""}
            </p>
          </div>
        </div>
        {submitted && property.status === "PENDING" && (
          <button
            type="button"
            disabled={verifying}
            onClick={onVerify}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
          >
            <CheckCircle className="h-4 w-4" />
            {verifying ? "Verifying…" : "Final verify (approve agent work)"}
          </button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-indigo-100 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            What was verified
          </p>
          <p className="mt-2 text-sm text-slate-800 whitespace-pre-wrap">
            {property.agentVerifiedItems || "—"}
          </p>
        </div>
        <div className="rounded-xl border border-indigo-100 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Source of verification
          </p>
          <p className="mt-2 text-sm text-slate-800 whitespace-pre-wrap">
            {property.agentVerificationSource || "—"}
          </p>
        </div>
        <div className="rounded-xl border border-indigo-100 bg-white p-4 md:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Remarks
          </p>
          <p className="mt-2 text-sm text-slate-800 whitespace-pre-wrap">
            {property.agentVerificationRemarks ||
              property.agentVerificationNotes ||
              "—"}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-sm font-semibold text-slate-800">
          Agent verified documents
        </p>
        {docs.length === 0 ? (
          <p className="text-sm text-slate-500">No documents uploaded by agent</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {docs.map((doc, index) => (
              <div
                key={`${doc.url}-${index}`}
                className="overflow-hidden rounded-lg border border-slate-200 bg-white"
              >
                {isImageDocument(doc.url, doc.fileName) ? (
                  <div className="relative h-36 bg-slate-50">
                    <Image
                      src={doc.url}
                      alt={doc.type}
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                ) : (
                  <div className="flex h-36 flex-col items-center justify-center gap-2 bg-slate-50">
                    <FileText className="h-8 w-8 text-slate-400" />
                    <span className="text-xs text-slate-500">PDF</span>
                  </div>
                )}
                <div className="border-t border-slate-100 p-3">
                  <p className="text-sm font-medium text-slate-900">
                    {verificationDocumentTypeLabels[
                      doc.type as VerificationDocumentType
                    ] || doc.type}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {doc.fileName}
                  </p>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View / Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {submitted && property.status === "PENDING" && (
        <p className="mt-4 text-sm text-slate-600">
          After you approve, mark the property <strong>Verified</strong>, then
          activate and use <strong>Post Property</strong> as usual.
        </p>
      )}
    </div>
  );
}
