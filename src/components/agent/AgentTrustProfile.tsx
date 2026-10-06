"use client";

import Link from "next/link";
import { Check, X, Award, Shield } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

export type AgentTrustProfileData = {
  id: string;
  userId?: string;
  name?: string | null;
  businessName: string;
  location?: string;
  identityVerified: boolean;
  officeVerified: boolean;
  propertiesSold: number;
  verifiedListings: number;
  documentDisputes: number;
  cancelledTransactions: number;
  avgResponseMinutes: number | null;
  memberSince: string | Date | null;
  trustScore: number;
  isGolden?: boolean;
};

function formatMemberYears(memberSince: string | Date | null): string {
  if (!memberSince) return "—";
  const since = new Date(memberSince);
  if (Number.isNaN(since.getTime())) return "—";
  const years = (Date.now() - since.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  if (years < 0.1) return "New member";
  return `${years.toFixed(1)} years`;
}

function ScoreRing({ score }: { score: number }) {
  const reduce = useReducedMotion();
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circ - (clamped / 100) * circ;
  const tone =
    clamped >= 85 ? "#d1a255" : clamped >= 70 ? "#2a7a52" : "#195b3b";

  return (
    <div className="relative mx-auto h-32 w-32">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="rgba(25,91,59,0.12)"
          strokeWidth="10"
        />
        <motion.circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={tone}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: reduce ? offset : offset }}
          transition={{ duration: reduce ? 0 : 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif text-3xl font-semibold text-[#18221b]">{score}</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5c6b61]">
          / 100
        </span>
      </div>
    </div>
  );
}

function MetricRow({
  label,
  value,
  ok,
}: {
  label: string;
  value: React.ReactNode;
  ok?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#dbe0d6]/70 py-2.5 last:border-0">
      <span className="text-[13px] text-[#5c6b61]">{label}</span>
      <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[#18221b]">
        {value}
        {ok === true && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Check className="h-3 w-3" aria-hidden />
          </span>
        )}
        {ok === false && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <X className="h-3 w-3" aria-hidden />
          </span>
        )}
      </span>
    </div>
  );
}

export default function AgentTrustProfile({
  agent,
  compact = false,
  showLink = false,
  elevated = false,
}: {
  agent: AgentTrustProfileData;
  compact?: boolean;
  showLink?: boolean;
  elevated?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-[#dbe0d6]/80 bg-gradient-to-b from-[#fffcf7] to-[#f3f7f1] ${
        elevated ? "shadow-[0_20px_50px_-24px_rgba(25,91,59,0.35)]" : "shadow-sm"
      } ${compact ? "p-4" : "p-6"}`}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-40"
        style={{
          background:
            "radial-gradient(circle, rgba(209,162,85,0.35) 0%, transparent 70%)",
        }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#195b3b]">
            <Shield className="h-3.5 w-3.5" />
            Trust Profile
          </p>
          <h3
            className={`mt-2 font-serif font-semibold tracking-tight text-[#18221b] ${
              compact ? "text-xl" : "text-2xl"
            }`}
          >
            {agent.businessName}
          </h3>
          {agent.name && (
            <p className="mt-0.5 text-sm text-[#5c6b61]">{agent.name}</p>
          )}
          {agent.location && (
            <p className="mt-1 text-xs text-[#5c6b61]/80">{agent.location}</p>
          )}
        </div>
        {agent.isGolden && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-gradient-to-r from-[#d1a255] to-[#e4c07a] px-2.5 py-1 text-[11px] font-bold text-[#18221b] shadow-sm">
            <Award className="h-3.5 w-3.5" />
            Golden
          </span>
        )}
      </div>

      <div className="relative mt-5">
        <ScoreRing score={agent.trustScore} />
        <p className="mt-2 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5c6b61]">
          Agent Trust Score
        </p>
      </div>

      <div className="relative mt-5 rounded-xl border border-[#dbe0d6]/80 bg-white/70 px-3.5 backdrop-blur-sm">
        <MetricRow
          label="Identity verified"
          value={agent.identityVerified ? "Yes" : "No"}
          ok={agent.identityVerified}
        />
        <MetricRow
          label="Office verified"
          value={agent.officeVerified ? "Yes" : "No"}
          ok={agent.officeVerified}
        />
        <MetricRow label="Properties sold" value={agent.propertiesSold} />
        <MetricRow label="Verified listings" value={agent.verifiedListings} />
        <MetricRow label="Document disputes" value={agent.documentDisputes} />
        <MetricRow label="Cancelled deals" value={agent.cancelledTransactions} />
        <MetricRow
          label="Avg response"
          value={
            agent.avgResponseMinutes != null
              ? `${agent.avgResponseMinutes} min`
              : "—"
          }
        />
        <MetricRow
          label="Platform member"
          value={formatMemberYears(agent.memberSince)}
        />
      </div>

      {showLink && (
        <Link
          href={`/agents/${agent.id}`}
          className="relative mt-4 inline-flex text-sm font-semibold text-[#195b3b] underline-offset-4 hover:underline"
        >
          View public profile →
        </Link>
      )}
    </div>
  );
}
