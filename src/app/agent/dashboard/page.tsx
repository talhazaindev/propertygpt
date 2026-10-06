"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { motion, useReducedMotion } from "framer-motion";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AgentTrustProfile, {
  AgentTrustProfileData,
} from "@/components/agent/AgentTrustProfile";
import {
  agentRequestCreateSchema,
  AgentRequestCreateValues,
} from "@/schemas/agent";
import {
  Award,
  Copy,
  Loader2,
  Share2,
  Target,
  Wallet,
  Building2,
  ClipboardCheck,
  MapPin,
  Sparkles,
  ArrowUpRight,
  Headset,
  CheckCircle2,
  Clock3,
  BadgeCheck,
} from "lucide-react";

type DashData = {
  profile: any;
  target: any | null;
  progress: { deals: number; verifications: number; referrals: number };
  earnings: { pending: number; approved: number; paid: number };
  requests: any[];
  assignedForVerification: any[];
  verifiedInventory: any[];
  completedByAgent: any[];
  opportunities: any[];
};

const REQUEST_TYPES = [
  { value: "PROPERTY_ASK" as const, label: "Ask for a property", hint: "Request inventory" },
  { value: "VERIFICATION_SUPPORT" as const, label: "Support verification", hint: "Earn commission" },
  { value: "CLIENT_REFERRAL" as const, label: "Bring a client", hint: "Introduce a buyer" },
  { value: "DEAL_CLOSE" as const, label: "Close a deal", hint: "Claim rewards" },
  { value: "SUPPORT" as const, label: "General support", hint: "Ask Manzil" },
];

function formatPkr(n: number) {
  return `PKR ${Math.round(n).toLocaleString()}`;
}

function useFadeUp() {
  const reduce = useReducedMotion();
  return (delay = 0) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] as const },
        };
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const reduce = useReducedMotion();
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-[#195b3b]/10">
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-[#195b3b] via-[#2a7a52] to-[#d1a255]"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: reduce ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

function statusTone(status: string) {
  switch (status) {
    case "SUBMITTED":
      return "bg-sky-100 text-sky-800";
    case "IN_PROGRESS":
      return "bg-amber-100 text-amber-900";
    case "ASSIGNED":
      return "bg-violet-100 text-violet-800";
    case "COMPLETED":
    case "APPROVED":
    case "VERIFIED":
    case "ACTIVE":
      return "bg-emerald-100 text-emerald-800";
    case "REJECTED":
    case "CANCELLED":
      return "bg-rose-100 text-rose-800";
    default:
      return "bg-[#edf0e7] text-[#5c6b61]";
  }
}

function payoutTone(status: string) {
  switch (status) {
    case "PAID":
      return "bg-emerald-100 text-emerald-800";
    case "APPROVED":
      return "bg-sky-100 text-sky-800";
    default:
      return "bg-amber-100 text-amber-900";
  }
}

function AgentDashboardInner() {
  const fadeUp = useFadeUp();
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);
  const [verifyNotes, setVerifyNotes] = useState<Record<string, string>>({});
  const [verifyBusy, setVerifyBusy] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AgentRequestCreateValues>({
    resolver: zodResolver(agentRequestCreateSchema),
    defaultValues: {
      type: "PROPERTY_ASK",
      title: "",
      description: "",
      clientName: "",
      clientPhone: "",
      clientEmail: "",
    },
  });

  const selectedType = watch("type");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get("/api/agents/dashboard");
      setData(res.data);
    } catch (err: unknown) {
      setError(
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to load dashboard"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onSubmitRequest = async (form: AgentRequestCreateValues) => {
    try {
      setSubmitting(true);
      setSubmitMsg(null);
      await axios.post("/api/agents/requests", {
        ...form,
        clientEmail: form.clientEmail || null,
        estimatedValue: form.estimatedValue || null,
      });
      setSubmitMsg("Request submitted to Manzil.");
      reset({
        type: form.type,
        title: "",
        description: "",
        clientName: "",
        clientPhone: "",
        clientEmail: "",
      });
      await load();
    } catch (err: unknown) {
      setSubmitMsg(
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to submit"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const submitVerification = async (
    propertyId: string,
    markInProgress?: boolean
  ) => {
    const notes = verifyNotes[propertyId]?.trim() || "";
    if (!markInProgress && notes.length < 10) {
      setSubmitMsg("Add at least 10 characters of verification notes.");
      return;
    }
    try {
      setVerifyBusy(propertyId);
      await axios.patch(`/api/agents/properties/${propertyId}/verify`, {
        notes: notes || "Started verification work.",
        markInProgress: !!markInProgress,
      });
      setSubmitMsg(
        markInProgress ? "Marked in progress." : "Verification submitted."
      );
      await load();
    } catch (err: unknown) {
      setSubmitMsg(
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Could not update verification"
      );
    } finally {
      setVerifyBusy(null);
    }
  };

  const shareProfile = async () => {
    if (!data?.profile?.id) return;
    const url = `${window.location.origin}/agents/${data.profile.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setSubmitMsg("Trust Profile link copied — share it with clients.");
    } catch {
      setSubmitMsg(url);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 bg-[radial-gradient(ellipse_at_top,_#e8f2ea_0%,_#faf8f3_55%)]">
        <Loader2 className="h-9 w-9 animate-spin text-[#195b3b]" />
        <p className="text-sm text-[#5c6b61]">Loading your agent workspace…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="font-serif text-2xl text-[#18221b]">Unable to load</p>
        <p className="mt-2 text-rose-600">{error}</p>
      </div>
    );
  }

  const p = data.profile;
  const trust: AgentTrustProfileData = {
    id: p.id,
    userId: p.userId,
    name: p.user?.name,
    businessName: p.businessName,
    location: p.location,
    identityVerified: p.identityVerified,
    officeVerified: p.officeVerified,
    propertiesSold: p.propertiesSold,
    verifiedListings: p.verifiedListings,
    documentDisputes: p.documentDisputes,
    cancelledTransactions: p.cancelledTransactions,
    avgResponseMinutes: p.avgResponseMinutes,
    memberSince: p.memberSince,
    trustScore: p.trustScore,
    isGolden: p.isGolden,
  };

  const needsClient =
    selectedType === "CLIENT_REFERRAL" || selectedType === "DEAL_CLOSE";

  const targetMax =
    (data.target?.dealsTarget || 0) +
    (data.target?.verificationsTarget || 0) +
    (data.target?.referralsTarget || 0);
  const targetDone =
    data.progress.deals +
    data.progress.verifications +
    data.progress.referrals;
  const targetPct =
    targetMax > 0 ? Math.min(100, Math.round((targetDone / targetMax) * 100)) : 0;

  const earningsCards = [
    {
      label: "Pending",
      amount: data.earnings.pending,
      icon: Clock3,
      wrap: "from-amber-50 to-orange-50 border-amber-200/70",
      iconBg: "bg-amber-100 text-amber-800",
    },
    {
      label: "Approved",
      amount: data.earnings.approved,
      icon: BadgeCheck,
      wrap: "from-sky-50 to-cyan-50 border-sky-200/70",
      iconBg: "bg-sky-100 text-sky-800",
    },
    {
      label: "Paid",
      amount: data.earnings.paid,
      icon: CheckCircle2,
      wrap: "from-emerald-50 to-teal-50 border-emerald-200/70",
      iconBg: "bg-emerald-100 text-emerald-800",
    },
  ] as const;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#faf8f3]">
      {/* Atmosphere */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px]"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 10% -10%, rgba(209,162,85,0.28), transparent 55%), radial-gradient(ellipse 70% 50% at 90% 0%, rgba(25,91,59,0.22), transparent 50%), linear-gradient(180deg, #eef5ef 0%, #faf8f3 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23195b3b' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
        {/* Hero */}
        <motion.section
          {...fadeUp(0)}
          className="relative overflow-hidden rounded-3xl border border-[#195b3b]/15 bg-gradient-to-br from-[#0f3d28] via-[#195b3b] to-[#2a7a52] p-6 text-[#faf8f3] shadow-[0_30px_60px_-28px_rgba(15,61,40,0.55)] sm:p-8"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 top-0 h-56 w-56 rounded-full bg-[#d1a255]/25 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-white/10 blur-2xl"
          />

          <div className="relative flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-xl">
              <p className="inline-flex items-center gap-2 rounded-md bg-white/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#e4c07a] backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Manzil Agent Workspace
              </p>
              <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                Welcome back
                {p.user?.name ? `, ${String(p.user.name).split(" ")[0]}` : ""}
              </h1>
              <p className="mt-2 text-sm text-[#d7e6db] sm:text-base">
                Build reputation, clear verifications, hit targets, and grow your
                business with Manzil — while staying owner of your desk.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-[#c5d9c9]">
                <MapPin className="h-4 w-4 text-[#d1a255]" />
                {p.location || "Pakistan"}
                <span className="mx-1 text-white/30">·</span>
                <span className="font-medium text-[#faf8f3]">{p.businessName}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {p.isGolden && (
                <span className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#d1a255] to-[#e8c878] px-3.5 py-2 text-sm font-bold text-[#18221b] shadow-md">
                  <Award className="h-4 w-4" />
                  Golden Agent
                </span>
              )}
              <button
                type="button"
                onClick={shareProfile}
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-3.5 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/20"
              >
                <Share2 className="h-4 w-4" />
                Share profile
              </button>
              <Link
                href={`/agents/${p.id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-[#faf8f3] px-3.5 py-2 text-sm font-semibold text-[#195b3b] transition hover:bg-white"
              >
                <Copy className="h-4 w-4" />
                Preview
              </Link>
            </div>
          </div>
        </motion.section>

        {submitMsg && (
          <motion.p
            {...fadeUp(0.05)}
            className="mt-4 rounded-xl border border-[#195b3b]/20 bg-[#e8f2ea] px-4 py-3 text-sm font-medium text-[#0f3d28]"
          >
            {submitMsg}
          </motion.p>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[340px_1fr]">
          {/* Sidebar */}
          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <motion.div {...fadeUp(0.08)}>
              <AgentTrustProfile agent={trust} elevated />
            </motion.div>
            {p.dedicatedSupport && (
              <motion.div
                {...fadeUp(0.12)}
                className="rounded-2xl border border-[#d1a255]/40 bg-gradient-to-br from-[#fff8eb] to-[#fffcf7] p-5 shadow-sm"
              >
                <div className="flex items-center gap-2 text-[#195b3b]">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d1a255]/25 text-[#8a6920]">
                    <Headset className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a6a30]">
                      Dedicated support
                    </p>
                    <p className="font-semibold text-[#18221b]">
                      {p.dedicatedSupport.name}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-[#5c6b61]">
                  {p.dedicatedSupport.email}
                </p>
                {p.dedicatedSupport.phoneNumber && (
                  <p className="text-sm text-[#5c6b61]">
                    {p.dedicatedSupport.phoneNumber}
                  </p>
                )}
              </motion.div>
            )}
          </div>

          {/* Main column */}
          <div className="space-y-6">
            {/* Target */}
            <motion.section
              {...fadeUp(0.1)}
              className="overflow-hidden rounded-2xl border border-[#dbe0d6] bg-[#fffcf7] shadow-[0_16px_40px_-28px_rgba(25,91,59,0.35)]"
            >
              <div className="flex items-center justify-between gap-3 border-b border-[#edf0e7] bg-gradient-to-r from-[#e8f2ea] to-transparent px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#195b3b] text-[#faf8f3]">
                    <Target className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="font-serif text-xl font-semibold text-[#18221b]">
                      {data.target?.label || "This month"}
                    </h2>
                    <p className="text-xs text-[#5c6b61]">Targets & rewards</p>
                  </div>
                </div>
                {data.target && (
                  <span className="rounded-lg bg-[#195b3b] px-3 py-1.5 text-sm font-bold text-[#faf8f3]">
                    {targetPct}%
                  </span>
                )}
              </div>
              <div className="p-5">
                {data.target ? (
                  <>
                    <ProgressBar value={targetDone} max={Math.max(targetMax, 1)} />
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      {[
                        {
                          label: "Deals",
                          cur: data.progress.deals,
                          max: data.target.dealsTarget,
                          color: "bg-[#195b3b]/8 text-[#195b3b]",
                        },
                        {
                          label: "Verifications",
                          cur: data.progress.verifications,
                          max: data.target.verificationsTarget,
                          color: "bg-[#2a7a52]/10 text-[#2a7a52]",
                        },
                        {
                          label: "Referrals",
                          cur: data.progress.referrals,
                          max: data.target.referralsTarget,
                          color: "bg-[#d1a255]/20 text-[#8a6a30]",
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className={`rounded-xl px-4 py-3 ${item.color}`}
                        >
                          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
                            {item.label}
                          </p>
                          <p className="mt-1 font-serif text-2xl font-semibold">
                            {item.cur}
                            <span className="text-base font-normal opacity-60">
                              /{item.max}
                            </span>
                          </p>
                        </div>
                      ))}
                    </div>
                    {(data.target.rewardDescription || data.target.rewardAmount) && (
                      <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#d1a255]/40 bg-gradient-to-r from-[#fff6e4] to-[#fffcf7] px-4 py-3">
                        <Award className="mt-0.5 h-4 w-4 shrink-0 text-[#d1a255]" />
                        <p className="text-sm text-[#18221b]">
                          <span className="font-semibold">Reward: </span>
                          {data.target.rewardDescription ||
                            formatPkr(data.target.rewardAmount || 0)}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-[#5c6b61]">
                    No active target yet. Manzil will set monthly goals for you.
                  </p>
                )}
              </div>
            </motion.section>

            {/* Earnings */}
            <motion.section {...fadeUp(0.14)}>
              <div className="mb-3 flex items-center gap-2">
                <Wallet className="h-5 w-5 text-[#195b3b]" />
                <h2 className="font-serif text-xl font-semibold text-[#18221b]">
                  Earnings
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {earningsCards.map((card, i) => {
                  const Icon = card.icon;
                  return (
                    <motion.div
                      key={card.label}
                      {...fadeUp(0.16 + i * 0.04)}
                      className={`rounded-2xl border bg-gradient-to-br p-4 shadow-sm ${card.wrap}`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#5c6b61]">
                          {card.label}
                        </p>
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.iconBg}`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                      </div>
                      <p className="mt-3 font-serif text-2xl font-semibold text-[#18221b]">
                        {formatPkr(card.amount)}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>

            {/* Assigned verifications */}
            <motion.section
              {...fadeUp(0.18)}
              className="rounded-2xl border border-[#dbe0d6] bg-[#fffcf7] shadow-sm"
            >
              <div className="flex items-center gap-3 border-b border-[#edf0e7] px-5 py-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  <ClipboardCheck className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-serif text-xl font-semibold text-[#18221b]">
                    Assigned for verification
                  </h2>
                  <p className="text-xs text-[#5c6b61]">
                    {data.assignedForVerification.length} active assignment
                    {data.assignedForVerification.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <div className="p-5">
                {data.assignedForVerification.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#c5d9c9] bg-[#f3f7f1] px-4 py-8 text-center">
                    <ClipboardCheck className="mx-auto h-8 w-8 text-[#2a7a52]/50" />
                    <p className="mt-2 text-sm text-[#5c6b61]">
                      Nothing waiting. When Manzil assigns a listing, it appears
                      here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.assignedForVerification.map((prop) => (
                      <div
                        key={prop.id}
                        className="rounded-2xl border border-[#dbe0d6] bg-white p-4 shadow-[0_8px_24px_-18px_rgba(25,91,59,0.4)]"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-serif text-lg font-semibold text-[#18221b]">
                                {prop.title}
                              </h3>
                              <span
                                className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${statusTone(
                                  prop.agentVerificationStatus
                                )}`}
                              >
                                {prop.agentVerificationStatus}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-[#5c6b61]">
                              {prop.address}
                              {prop.city?.name ? ` · ${prop.city.name}` : ""}
                            </p>
                          </div>
                          <p className="rounded-lg bg-[#195b3b]/8 px-3 py-1.5 font-serif text-lg font-semibold text-[#195b3b]">
                            {formatPkr(prop.price)}
                          </p>
                        </div>
                        <textarea
                          className="mt-3 w-full rounded-xl border border-[#dbe0d6] bg-[#faf8f3] px-3.5 py-2.5 text-sm outline-none transition focus:border-[#195b3b] focus:ring-2 focus:ring-[#195b3b]/15"
                          rows={3}
                          placeholder="Verification notes — site visit, documents, ownership checks…"
                          value={
                            verifyNotes[prop.id] ||
                            prop.agentVerificationNotes ||
                            ""
                          }
                          onChange={(e) =>
                            setVerifyNotes((m) => ({
                              ...m,
                              [prop.id]: e.target.value,
                            }))
                          }
                        />
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={verifyBusy === prop.id}
                            onClick={() => submitVerification(prop.id, true)}
                            className="rounded-xl border border-[#dbe0d6] bg-white px-4 py-2 text-sm font-medium text-[#18221b] transition hover:bg-[#edf0e7] disabled:opacity-60"
                          >
                            Mark in progress
                          </button>
                          <button
                            type="button"
                            disabled={verifyBusy === prop.id}
                            onClick={() => submitVerification(prop.id, false)}
                            className="rounded-xl bg-gradient-to-r from-[#195b3b] to-[#2a7a52] px-4 py-2 text-sm font-semibold text-[#faf8f3] shadow-sm transition hover:opacity-95 disabled:opacity-60"
                          >
                            {verifyBusy === prop.id
                              ? "Saving…"
                              : "Submit verification"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.section>

            {/* Inventory + opportunities */}
            <div className="grid gap-6 lg:grid-cols-2">
              <motion.section
                {...fadeUp(0.2)}
                className="rounded-2xl border border-[#dbe0d6] bg-[#fffcf7] p-5 shadow-sm"
              >
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <h2 className="font-serif text-lg font-semibold text-[#18221b]">
                    Verified properties
                  </h2>
                </div>
                <ul className="space-y-2.5">
                  {data.verifiedInventory.length === 0 && (
                    <li className="text-sm text-[#5c6b61]">
                      No verified inventory yet.
                    </li>
                  )}
                  {data.verifiedInventory.slice(0, 6).map((prop) => (
                    <li key={prop.id}>
                      <Link
                        href={`/properties/${prop.id}`}
                        className="group flex items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-2.5 transition hover:border-[#c5d9c9] hover:bg-[#f3f7f1]"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-[#18221b] group-hover:text-[#195b3b]">
                            {prop.title}
                          </p>
                          <p className="truncate text-xs text-[#5c6b61]">
                            {prop.city?.name || prop.address}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${statusTone(
                            prop.status
                          )}`}
                        >
                          {prop.status}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.section>

              <motion.section
                {...fadeUp(0.22)}
                className="rounded-2xl border border-[#d1a255]/35 bg-gradient-to-br from-[#fff8eb] to-[#fffcf7] p-5 shadow-sm"
              >
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d1a255]/30 text-[#8a6a30]">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <h2 className="font-serif text-lg font-semibold text-[#18221b]">
                    Opportunities near you
                  </h2>
                </div>
                <ul className="space-y-2.5">
                  {data.opportunities.slice(0, 6).map((prop) => (
                    <li key={prop.id}>
                      <Link
                        href={`/properties/${prop.id}`}
                        className="group flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 transition hover:bg-white/80"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-[#18221b]">
                            {prop.title}
                          </p>
                          <p className="text-xs text-[#5c6b61]">
                            {formatPkr(prop.price)}
                            {prop.city?.name ? ` · ${prop.city.name}` : ""}
                          </p>
                        </div>
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-[#d1a255] opacity-0 transition group-hover:opacity-100" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.section>
            </div>

            {/* Quick actions */}
            <motion.section
              {...fadeUp(0.24)}
              className="rounded-2xl border border-[#dbe0d6] bg-[#fffcf7] p-5 shadow-sm"
            >
              <h2 className="font-serif text-xl font-semibold text-[#18221b]">
                Quick actions
              </h2>
              <p className="mt-1 text-sm text-[#5c6b61]">
                Ask for inventory, support verification, bring clients, or close
                deals.
              </p>
              <form
                className="mt-5 space-y-3"
                onSubmit={handleSubmit(onSubmitRequest)}
              >
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {REQUEST_TYPES.map((t) => (
                    <label
                      key={t.value}
                      className={`cursor-pointer rounded-xl border px-3 py-3 transition ${
                        selectedType === t.value
                          ? "border-[#195b3b] bg-[#e8f2ea] shadow-sm"
                          : "border-[#dbe0d6] bg-white hover:border-[#c5d9c9]"
                      }`}
                    >
                      <input
                        type="radio"
                        value={t.value}
                        {...register("type")}
                        className="sr-only"
                      />
                      <p className="text-sm font-semibold text-[#18221b]">
                        {t.label}
                      </p>
                      <p className="text-xs text-[#5c6b61]">{t.hint}</p>
                    </label>
                  ))}
                </div>
                <input
                  {...register("title")}
                  placeholder="Title"
                  className="w-full rounded-xl border border-[#dbe0d6] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#195b3b] focus:ring-2 focus:ring-[#195b3b]/15"
                />
                {errors.title && (
                  <p className="text-sm text-rose-600">{errors.title.message}</p>
                )}
                <textarea
                  {...register("description")}
                  rows={3}
                  placeholder="Details"
                  className="w-full rounded-xl border border-[#dbe0d6] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#195b3b] focus:ring-2 focus:ring-[#195b3b]/15"
                />
                {errors.description && (
                  <p className="text-sm text-rose-600">
                    {errors.description.message}
                  </p>
                )}
                {needsClient && (
                  <div className="grid gap-2 sm:grid-cols-3">
                    <input
                      {...register("clientName")}
                      placeholder="Client name"
                      className="rounded-xl border border-[#dbe0d6] px-3 py-2.5 text-sm"
                    />
                    <input
                      {...register("clientPhone")}
                      placeholder="Client phone"
                      className="rounded-xl border border-[#dbe0d6] px-3 py-2.5 text-sm"
                    />
                    <input
                      {...register("clientEmail")}
                      placeholder="Client email"
                      className="rounded-xl border border-[#dbe0d6] px-3 py-2.5 text-sm"
                    />
                  </div>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#195b3b] to-[#2a7a52] px-5 py-2.5 text-sm font-semibold text-[#faf8f3] shadow-md transition hover:opacity-95 disabled:opacity-60"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Submit request
                </button>
              </form>
            </motion.section>

            {/* Pipeline */}
            <motion.section
              {...fadeUp(0.26)}
              className="overflow-hidden rounded-2xl border border-[#dbe0d6] bg-[#fffcf7] shadow-sm"
            >
              <div className="border-b border-[#edf0e7] px-5 py-4">
                <h2 className="font-serif text-xl font-semibold text-[#18221b]">
                  Pipeline / my requests
                </h2>
              </div>
              {data.requests.length === 0 ? (
                <p className="px-5 py-8 text-sm text-[#5c6b61]">
                  No requests yet — use quick actions above to get started.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#f3f7f1] text-[11px] font-bold uppercase tracking-wider text-[#5c6b61]">
                      <tr>
                        <th className="px-5 py-3">Type</th>
                        <th className="px-3 py-3">Title</th>
                        <th className="px-3 py-3">Status</th>
                        <th className="px-3 py-3">Payout</th>
                        <th className="px-5 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.requests.map((r) => (
                        <tr
                          key={r.id}
                          className="border-t border-[#edf0e7] transition hover:bg-[#faf8f3]"
                        >
                          <td className="px-5 py-3 text-[#5c6b61]">
                            {r.type.replace(/_/g, " ")}
                          </td>
                          <td className="px-3 py-3 font-medium text-[#18221b]">
                            {r.title}
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${statusTone(
                                r.status
                              )}`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${payoutTone(
                                r.payoutStatus || "PENDING"
                              )}`}
                            >
                              {r.payoutStatus || "PENDING"}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right font-semibold text-[#195b3b]">
                            {formatPkr(
                              (r.commissionAmount || 0) + (r.bonusAmount || 0)
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.section>

            {data.completedByAgent.length > 0 && (
              <motion.section
                {...fadeUp(0.28)}
                className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 to-[#fffcf7] p-5"
              >
                <h2 className="font-serif text-lg font-semibold text-[#18221b]">
                  Your completed verifications
                </h2>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {data.completedByAgent.map((prop) => (
                    <li key={prop.id}>
                      <Link
                        href={`/properties/${prop.id}`}
                        className="flex items-center justify-between rounded-xl bg-white/80 px-3 py-2.5 text-sm font-medium text-[#195b3b] transition hover:bg-white"
                      >
                        {prop.title}
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgentDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["AGENT"]}>
      <AgentDashboardInner />
    </ProtectedRoute>
  );
}
