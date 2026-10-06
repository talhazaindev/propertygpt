"use client";

import { useState } from "react";
import Image from "next/image";
import axios from "axios";
import {
  FileText,
  ExternalLink,
  Loader2,
  Upload,
  X,
  Camera,
} from "lucide-react";
import {
  verificationDocumentTypes,
  verificationDocumentTypeLabels,
  isAcceptedDocumentFile,
  type VerificationDocumentType,
} from "@/schemas/property";
import { uploadFiles } from "@/lib/uploadthing";

type Doc = {
  type: string;
  url: string;
  fileName?: string;
};

type PropertyAssignment = {
  id: string;
  title: string;
  address: string;
  price: number;
  description?: string;
  images?: string[];
  verificationDocuments?: Doc[];
  agentVerificationStatus: string;
  agentVerificationNotes?: string | null;
  agentVerificationRemarks?: string | null;
  agentVerifiedItems?: string | null;
  agentVerificationSource?: string | null;
  agentVerifiedDocuments?: Doc[];
  city?: { name?: string } | null;
};

function isImageDoc(url: string, fileName?: string) {
  const t = (fileName || url).toLowerCase();
  return (
    t.endsWith(".jpg") ||
    t.endsWith(".jpeg") ||
    t.endsWith(".png") ||
    t.endsWith(".webp")
  );
}

function formatPkr(n: number) {
  return `PKR ${Math.round(n).toLocaleString()}`;
}

function statusTone(status: string) {
  switch (status) {
    case "SUBMITTED":
      return "bg-sky-100 text-sky-800";
    case "IN_PROGRESS":
      return "bg-amber-100 text-amber-900";
    case "ASSIGNED":
      return "bg-violet-100 text-violet-800";
    default:
      return "bg-[#edf0e7] text-[#5c6b61]";
  }
}

export default function AgentAssignedVerificationCard({
  property,
  onUpdated,
  onMessage,
}: {
  property: PropertyAssignment;
  onUpdated: () => Promise<void> | void;
  onMessage: (msg: string) => void;
}) {
  const [activeImage, setActiveImage] = useState(0);
  const [remarks, setRemarks] = useState(
    property.agentVerificationRemarks || property.agentVerificationNotes || ""
  );
  const [verifiedItems, setVerifiedItems] = useState(
    property.agentVerifiedItems || ""
  );
  const [verificationSource, setVerificationSource] = useState(
    property.agentVerificationSource || ""
  );
  const [docType, setDocType] = useState<VerificationDocumentType | "">("");
  const [pendingDocs, setPendingDocs] = useState<
    Array<{ type: VerificationDocumentType; file: File; preview: string }>
  >([]);
  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const images = property.images || [];
  const ownerDocs = property.verificationDocuments || [];
  const alreadySubmitted = property.agentVerificationStatus === "SUBMITTED";

  const addDoc = (file: File | null) => {
    if (!file || !docType) {
      onMessage("Select a document type, then choose a file.");
      return;
    }
    if (!isAcceptedDocumentFile(file)) {
      onMessage("Use PDF or JPG/JPEG up to 16MB.");
      return;
    }
    setPendingDocs((prev) => [
      ...prev,
      { type: docType, file, preview: URL.createObjectURL(file) },
    ]);
    setDocType("");
  };

  const removeDoc = (index: number) => {
    setPendingDocs((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[index].preview);
      next.splice(index, 1);
      return next;
    });
  };

  const markInProgress = async () => {
    try {
      setBusy(true);
      await axios.patch(`/api/agents/properties/${property.id}/verify`, {
        markInProgress: true,
        remarks: remarks || "Started verification work.",
      });
      onMessage("Marked in progress.");
      await onUpdated();
    } catch (err: unknown) {
      onMessage(
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Could not update status"
      );
    } finally {
      setBusy(false);
    }
  };

  const submitVerification = async () => {
    if (remarks.trim().length < 10) {
      onMessage("Add remarks (at least 10 characters).");
      return;
    }
    if (verifiedItems.trim().length < 10) {
      onMessage("Describe what you verified.");
      return;
    }
    if (verificationSource.trim().length < 5) {
      onMessage("Tell us your source of verification.");
      return;
    }
    if (pendingDocs.length === 0 && !(property.agentVerifiedDocuments?.length)) {
      onMessage("Upload at least one verified document.");
      return;
    }

    try {
      setBusy(true);
      setUploadProgress(5);

      let documents =
        property.agentVerifiedDocuments?.map((d) => ({
          type: d.type,
          url: d.url,
          fileName: d.fileName || "document",
        })) || [];

      if (pendingDocs.length > 0) {
        const results = await uploadFiles("verificationDocuments", {
          files: pendingDocs.map((d) => d.file),
          onUploadProgress: ({ totalProgress }) => {
            setUploadProgress(Math.min(80, Math.round(totalProgress * 0.8)));
          },
        });

        const uploaded = pendingDocs.map((doc, i) => {
          const file = results[i] as { ufsUrl?: string; url?: string };
          const url = file?.ufsUrl || file?.url || "";
          if (!url) throw new Error(`Failed to upload ${doc.file.name}`);
          return {
            type: doc.type,
            url,
            fileName: doc.file.name,
          };
        });
        documents = [...documents, ...uploaded];
      }

      setUploadProgress(90);
      await axios.patch(`/api/agents/properties/${property.id}/verify`, {
        remarks: remarks.trim(),
        verifiedItems: verifiedItems.trim(),
        verificationSource: verificationSource.trim(),
        documents,
      });
      setUploadProgress(100);
      onMessage("Verification submitted. Admin will do the final review.");
      setPendingDocs([]);
      await onUpdated();
    } catch (err: unknown) {
      onMessage(
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : err instanceof Error
            ? err.message
            : "Submit failed"
      );
    } finally {
      setBusy(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[#dbe0d6] bg-white shadow-[0_8px_24px_-18px_rgba(25,91,59,0.4)]">
      <div className="border-b border-[#edf0e7] bg-gradient-to-r from-[#f3f7f1] to-white px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-serif text-lg font-semibold text-[#18221b]">
                {property.title}
              </h3>
              <span
                className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${statusTone(
                  property.agentVerificationStatus
                )}`}
              >
                {property.agentVerificationStatus}
              </span>
            </div>
            <p className="mt-1 text-sm text-[#5c6b61]">
              {property.address}
              {property.city?.name ? ` · ${property.city.name}` : ""}
            </p>
          </div>
          <p className="rounded-lg bg-[#195b3b]/8 px-3 py-1.5 font-serif text-lg font-semibold text-[#195b3b]">
            {formatPkr(property.price)}
          </p>
        </div>
      </div>

      <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-2">
        {/* Images */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#5c6b61]">
            Property images
          </p>
          {images.length > 0 ? (
            <>
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#edf0e7]">
                <Image
                  src={images[activeImage] || images[0]}
                  alt={property.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 400px"
                />
              </div>
              {images.length > 1 && (
                <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                  {images.map((src, i) => (
                    <button
                      key={src + i}
                      type="button"
                      onClick={() => setActiveImage(i)}
                      className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${
                        activeImage === i
                          ? "border-[#195b3b]"
                          : "border-transparent"
                      }`}
                    >
                      <Image src={src} alt="" fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex aspect-[4/3] flex-col items-center justify-center rounded-xl bg-[#edf0e7] text-[#5c6b61]">
              <Camera className="mb-2 h-8 w-8 opacity-40" />
              <p className="text-sm">No images</p>
            </div>
          )}
        </div>

        {/* Owner verification docs */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#5c6b61]">
            Owner verification documents
          </p>
          {ownerDocs.length > 0 ? (
            <div className="grid max-h-[320px] gap-2 overflow-y-auto sm:grid-cols-2">
              {ownerDocs.map((doc, i) => (
                <a
                  key={`${doc.url}-${i}`}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-[#dbe0d6] bg-[#faf8f3] p-2 transition hover:border-[#195b3b]/40"
                >
                  {isImageDoc(doc.url, doc.fileName) ? (
                    <div className="relative mb-2 h-24 overflow-hidden rounded-lg bg-white">
                      <Image
                        src={doc.url}
                        alt={doc.type}
                        fill
                        className="object-contain p-1"
                      />
                    </div>
                  ) : (
                    <div className="mb-2 flex h-24 items-center justify-center rounded-lg bg-white">
                      <FileText className="h-8 w-8 text-[#5c6b61]/50" />
                    </div>
                  )}
                  <p className="text-xs font-semibold text-[#18221b]">
                    {verificationDocumentTypeLabels[
                      doc.type as VerificationDocumentType
                    ] || doc.type}
                  </p>
                  <p className="flex items-center gap-1 text-[11px] text-[#195b3b]">
                    <ExternalLink className="h-3 w-3" /> Open
                  </p>
                </a>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#c5d9c9] bg-[#f3f7f1] px-3 py-8 text-center text-sm text-[#5c6b61]">
              No owner documents attached
            </div>
          )}
        </div>
      </div>

      {property.description && (
        <div className="border-t border-[#edf0e7] px-4 py-3 sm:px-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#5c6b61]">
            Description
          </p>
          <p className="mt-1 line-clamp-4 text-sm text-[#5c6b61]">
            {property.description}
          </p>
        </div>
      )}

      {/* Agent submission form */}
      <div className="border-t border-[#edf0e7] bg-[#faf8f3] px-4 py-5 sm:px-5">
        {alreadySubmitted ? (
          <div className="space-y-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
            <p className="font-semibold">Submitted — awaiting admin final review</p>
            {property.agentVerifiedItems && (
              <p>
                <span className="font-medium">Verified: </span>
                {property.agentVerifiedItems}
              </p>
            )}
            {property.agentVerificationSource && (
              <p>
                <span className="font-medium">Source: </span>
                {property.agentVerificationSource}
              </p>
            )}
            {(property.agentVerificationRemarks ||
              property.agentVerificationNotes) && (
              <p>
                <span className="font-medium">Remarks: </span>
                {property.agentVerificationRemarks ||
                  property.agentVerificationNotes}
              </p>
            )}
            {!!property.agentVerifiedDocuments?.length && (
              <div className="flex flex-wrap gap-2 pt-1">
                {property.agentVerifiedDocuments.map((doc, i) => (
                  <a
                    key={i}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-[#195b3b] ring-1 ring-sky-200"
                  >
                    <FileText className="h-3 w-3" />
                    {doc.fileName || doc.type}
                  </a>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-[#18221b]">
              Submit your verification
            </p>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#5c6b61]">
                What did you verify?
              </label>
              <textarea
                rows={2}
                value={verifiedItems}
                onChange={(e) => setVerifiedItems(e.target.value)}
                placeholder="e.g. Ownership title, mutation, physical possession, plot dimensions…"
                className="w-full rounded-xl border border-[#dbe0d6] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#195b3b] focus:ring-2 focus:ring-[#195b3b]/15"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#5c6b61]">
                Source of verification
              </label>
              <input
                value={verificationSource}
                onChange={(e) => setVerificationSource(e.target.value)}
                placeholder="e.g. Registrar office visit, society office, NADRA check, seller interview…"
                className="w-full rounded-xl border border-[#dbe0d6] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#195b3b] focus:ring-2 focus:ring-[#195b3b]/15"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#5c6b61]">
                Remarks
              </label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Detailed findings, red flags, recommendations for Manzil…"
                className="w-full rounded-xl border border-[#dbe0d6] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#195b3b] focus:ring-2 focus:ring-[#195b3b]/15"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#5c6b61]">
                Upload verified documents
              </label>
              <div className="flex flex-wrap gap-2">
                <select
                  value={docType}
                  onChange={(e) =>
                    setDocType(e.target.value as VerificationDocumentType | "")
                  }
                  className="rounded-xl border border-[#dbe0d6] bg-white px-3 py-2 text-sm"
                >
                  <option value="">Document type…</option>
                  {verificationDocumentTypes.map((t) => (
                    <option key={t} value={t}>
                      {verificationDocumentTypeLabels[t]}
                    </option>
                  ))}
                </select>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#dbe0d6] bg-white px-3 py-2 text-sm font-medium text-[#18221b] hover:bg-[#edf0e7]">
                  <Upload className="h-4 w-4" />
                  Add file
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,application/pdf,image/jpeg"
                    className="hidden"
                    onChange={(e) => {
                      addDoc(e.target.files?.[0] || null);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
              {pendingDocs.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {pendingDocs.map((doc, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-[#dbe0d6]"
                    >
                      <span>
                        <span className="font-medium">
                          {verificationDocumentTypeLabels[doc.type]}
                        </span>
                        {" — "}
                        {doc.file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeDoc(i)}
                        className="text-[#5c6b61] hover:text-rose-600"
                        aria-label="Remove"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {uploadProgress > 0 && (
              <div className="h-2 overflow-hidden rounded-full bg-[#195b3b]/10">
                <div
                  className="h-full bg-[#195b3b] transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                disabled={busy}
                onClick={markInProgress}
                className="rounded-xl border border-[#dbe0d6] bg-white px-4 py-2.5 text-sm font-medium disabled:opacity-60"
              >
                Mark in progress
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={submitVerification}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#195b3b] to-[#2a7a52] px-4 py-2.5 text-sm font-semibold text-[#faf8f3] disabled:opacity-60"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit verification
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
