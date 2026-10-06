"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { ArrowLeft, Loader2, Award } from "lucide-react";
import { computeTrustScore, GOLDEN_SCORE_SUGGESTION } from "@/lib/agent-trust";

type SupportMember = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export default function AdminAgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agent, setAgent] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [supportMembers, setSupportMembers] = useState<SupportMember[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [targets, setTargets] = useState<any[]>([]);
  const [targetForm, setTargetForm] = useState({
    label: "This month",
    periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10),
    periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10),
    dealsTarget: 2,
    verificationsTarget: 5,
    referralsTarget: 3,
    rewardDescription: "",
    rewardAmount: "",
  });

  const [form, setForm] = useState({
    identityVerified: false,
    officeVerified: false,
    propertiesSold: 0,
    verifiedListings: 0,
    documentDisputes: 0,
    cancelledTransactions: 0,
    avgResponseMinutes: "" as string | number,
    isGolden: false,
    dedicatedSupportId: "",
    adminNotes: "",
    trustScore: 50,
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [agentRes, teamRes, targetsRes] = await Promise.all([
        axios.get(`/api/admin/agents/${id}`, {
          headers: { "x-admin-auth": "true" },
        }),
        axios.get(`/api/admin/team?role=CUSTOMER_SUPPORT&limit=50`, {
          headers: { "x-admin-auth": "true" },
        }),
        axios.get(`/api/admin/agents/${id}/targets`, {
          headers: { "x-admin-auth": "true" },
        }),
      ]);
      const a = agentRes.data.agent;
      setAgent(a);
      setRequests(agentRes.data.requests || []);
      setActivities(agentRes.data.activities || []);
      setSupportMembers(teamRes.data.teamMembers || []);
      setTargets(targetsRes.data.targets || []);
      setForm({
        identityVerified: a.identityVerified,
        officeVerified: a.officeVerified,
        propertiesSold: a.propertiesSold,
        verifiedListings: a.verifiedListings,
        documentDisputes: a.documentDisputes,
        cancelledTransactions: a.cancelledTransactions,
        avgResponseMinutes: a.avgResponseMinutes ?? "",
        isGolden: a.isGolden,
        dedicatedSupportId: a.dedicatedSupportId || "",
        adminNotes: a.adminNotes || "",
        trustScore: a.trustScore,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (payload: Record<string, unknown>, successMsg: string) => {
    try {
      setSaving(true);
      setMessage(null);
      await axios.patch(`/api/admin/agents/${id}`, payload, {
        headers: { "x-admin-auth": "true" },
      });
      setMessage(successMsg);
      await load();
    } catch (e: unknown) {
      setMessage(
        axios.isAxiosError(e) && e.response?.data?.error
          ? e.response.data.error
          : "Update failed"
      );
    } finally {
      setSaving(false);
    }
  };

  const saveReputation = () => {
    const avg =
      form.avgResponseMinutes === "" || form.avgResponseMinutes === null
        ? null
        : Number(form.avgResponseMinutes);
    patch(
      {
        identityVerified: form.identityVerified,
        officeVerified: form.officeVerified,
        propertiesSold: Number(form.propertiesSold),
        verifiedListings: Number(form.verifiedListings),
        documentDisputes: Number(form.documentDisputes),
        cancelledTransactions: Number(form.cancelledTransactions),
        avgResponseMinutes: avg,
        isGolden: form.isGolden,
        dedicatedSupportId: form.dedicatedSupportId || null,
        adminNotes: form.adminNotes || null,
        recomputeTrustScore: true,
      },
      "Reputation saved (trust score recomputed)"
    );
  };

  const overrideScore = () => {
    patch(
      { trustScore: Number(form.trustScore), trustScoreOverride: true },
      "Trust score overridden"
    );
  };

  const saveTarget = async () => {
    try {
      setSaving(true);
      await axios.post(
        `/api/admin/agents/${id}/targets`,
        {
          ...targetForm,
          rewardAmount:
            targetForm.rewardAmount === ""
              ? null
              : Number(targetForm.rewardAmount),
          rewardDescription: targetForm.rewardDescription || null,
          periodStart: new Date(targetForm.periodStart).toISOString(),
          periodEnd: new Date(targetForm.periodEnd + "T23:59:59").toISOString(),
        },
        { headers: { "x-admin-auth": "true" } }
      );
      setMessage("Target saved");
      await load();
    } catch (e: unknown) {
      setMessage(
        axios.isAxiosError(e) && e.response?.data?.error
          ? e.response.data.error
          : "Failed to save target"
      );
    } finally {
      setSaving(false);
    }
  };

  const updateRequest = async (
    requestId: string,
    data: Record<string, unknown>
  ) => {
    await axios.patch(`/api/admin/agents/requests/${requestId}`, data, {
      headers: { "x-admin-auth": "true" },
    });
    await load();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!agent) {
    return <p className="text-slate-500">Agent not found</p>;
  }

  const previewScore = computeTrustScore({
    identityVerified: form.identityVerified,
    officeVerified: form.officeVerified,
    propertiesSold: Number(form.propertiesSold),
    verifiedListings: Number(form.verifiedListings),
    documentDisputes: Number(form.documentDisputes),
    cancelledTransactions: Number(form.cancelledTransactions),
    avgResponseMinutes:
      form.avgResponseMinutes === "" ? null : Number(form.avgResponseMinutes),
    memberSince: agent.memberSince,
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button
            onClick={() => router.push("/admin/agents")}
            className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" /> Back to agents
          </button>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            {agent.businessName}
            {agent.isGolden && <Award className="h-5 w-5 text-amber-500" />}
          </h1>
          <p className="text-sm text-slate-500">
            {agent.user?.name} · {agent.user?.email} · {agent.phoneNumber}
          </p>
          <p className="mt-1 text-sm text-slate-600">{agent.businessAddress}</p>
          <p className="text-sm text-slate-600">{agent.location}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {agent.status === "PENDING" && (
            <>
              <button
                disabled={saving}
                onClick={() =>
                  patch({ status: "ACTIVE" }, "Agent approved and activated")
                }
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Approve & activate
              </button>
              <button
                disabled={saving}
                onClick={() => patch({ status: "REJECTED" }, "Application rejected")}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Reject
              </button>
            </>
          )}
          {agent.status === "ACTIVE" && (
            <button
              disabled={saving}
              onClick={() => patch({ status: "SUSPENDED" }, "Agent suspended")}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white"
            >
              Suspend
            </button>
          )}
          {agent.status === "SUSPENDED" && (
            <button
              disabled={saving}
              onClick={() => patch({ status: "ACTIVE" }, "Agent reactivated")}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
            >
              Reactivate
            </button>
          )}
          <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium">
            {agent.status}
          </span>
        </div>
      </div>

      {message && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
          {message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">Reputation</h2>
          <p className="text-xs text-slate-500">
            Preview score with current edits: {previewScore}/100
            {previewScore >= GOLDEN_SCORE_SUGGESTION &&
              " (suggest Golden ≥ 85 — toggle manually)"}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.identityVerified}
                onChange={(e) =>
                  setForm((f) => ({ ...f, identityVerified: e.target.checked }))
                }
              />
              Identity verified
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.officeVerified}
                onChange={(e) =>
                  setForm((f) => ({ ...f, officeVerified: e.target.checked }))
                }
              />
              Office verified
            </label>
            {(
              [
                ["propertiesSold", "Properties sold"],
                ["verifiedListings", "Verified listings"],
                ["documentDisputes", "Document disputes"],
                ["cancelledTransactions", "Cancelled transactions"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="text-xs text-slate-500">{label}</label>
                <input
                  type="number"
                  min={0}
                  value={form[key]}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [key]: Number(e.target.value) }))
                  }
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>
            ))}
            <div>
              <label className="text-xs text-slate-500">Avg response (min)</label>
              <input
                type="number"
                min={0}
                value={form.avgResponseMinutes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, avgResponseMinutes: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isGolden}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isGolden: e.target.checked }))
                }
              />
              Golden Agent
            </label>
          </div>

          <div className="mt-4">
            <label className="text-xs text-slate-500">Dedicated support</label>
            <select
              value={form.dedicatedSupportId}
              onChange={(e) =>
                setForm((f) => ({ ...f, dedicatedSupportId: e.target.value }))
              }
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="">None</option>
              {supportMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.email})
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <label className="text-xs text-slate-500">Admin notes</label>
            <textarea
              value={form.adminNotes}
              onChange={(e) =>
                setForm((f) => ({ ...f, adminNotes: e.target.value }))
              }
              rows={3}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              disabled={saving}
              onClick={saveReputation}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
            >
              Save reputation
            </button>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={100}
                value={form.trustScore}
                onChange={(e) =>
                  setForm((f) => ({ ...f, trustScore: Number(e.target.value) }))
                }
                className="w-20 rounded-lg border px-2 py-2 text-sm"
              />
              <button
                disabled={saving}
                onClick={overrideScore}
                className="rounded-lg border px-3 py-2 text-sm"
              >
                Override score
              </button>
            </div>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Current stored score: <strong>{agent.trustScore}/100</strong>
            {agent.trustScoreOverride ? " (manual override)" : ""}
          </p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">Activity</h2>
          <ul className="mt-4 max-h-96 space-y-3 overflow-y-auto text-sm">
            {activities.length === 0 && (
              <li className="text-slate-500">No activity yet</li>
            )}
            {activities.map((a) => (
              <li key={a.id} className="border-b border-slate-100 pb-2">
                <div className="font-medium text-slate-800">{a.message}</div>
                <div className="text-xs text-slate-500">
                  {a.kind} · {new Date(a.createdAt).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Monthly target & reward</h2>
        <p className="text-sm text-slate-500 mb-4">
          Sets the active target shown on the agent dashboard.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            className="rounded border px-3 py-2 text-sm"
            value={targetForm.label}
            onChange={(e) =>
              setTargetForm((f) => ({ ...f, label: e.target.value }))
            }
            placeholder="Label"
          />
          <input
            type="date"
            className="rounded border px-3 py-2 text-sm"
            value={targetForm.periodStart}
            onChange={(e) =>
              setTargetForm((f) => ({ ...f, periodStart: e.target.value }))
            }
          />
          <input
            type="date"
            className="rounded border px-3 py-2 text-sm"
            value={targetForm.periodEnd}
            onChange={(e) =>
              setTargetForm((f) => ({ ...f, periodEnd: e.target.value }))
            }
          />
          <input
            type="number"
            className="rounded border px-3 py-2 text-sm"
            value={targetForm.dealsTarget}
            onChange={(e) =>
              setTargetForm((f) => ({
                ...f,
                dealsTarget: Number(e.target.value),
              }))
            }
            placeholder="Deals target"
          />
          <input
            type="number"
            className="rounded border px-3 py-2 text-sm"
            value={targetForm.verificationsTarget}
            onChange={(e) =>
              setTargetForm((f) => ({
                ...f,
                verificationsTarget: Number(e.target.value),
              }))
            }
            placeholder="Verifications target"
          />
          <input
            type="number"
            className="rounded border px-3 py-2 text-sm"
            value={targetForm.referralsTarget}
            onChange={(e) =>
              setTargetForm((f) => ({
                ...f,
                referralsTarget: Number(e.target.value),
              }))
            }
            placeholder="Referrals target"
          />
          <input
            className="rounded border px-3 py-2 text-sm sm:col-span-2"
            value={targetForm.rewardDescription}
            onChange={(e) =>
              setTargetForm((f) => ({
                ...f,
                rewardDescription: e.target.value,
              }))
            }
            placeholder="Reward description"
          />
          <input
            type="number"
            className="rounded border px-3 py-2 text-sm"
            value={targetForm.rewardAmount}
            onChange={(e) =>
              setTargetForm((f) => ({ ...f, rewardAmount: e.target.value }))
            }
            placeholder="Reward amount PKR"
          />
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={saveTarget}
          className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white"
        >
          Save as active target
        </button>
        {targets[0] && (
          <p className="mt-3 text-xs text-slate-500">
            Latest: {targets[0].label} · deals {targets[0].dealsTarget} ·
            verifications {targets[0].verificationsTarget} · referrals{" "}
            {targets[0].referralsTarget}
            {targets[0].isActive ? " (active)" : ""}
          </p>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Requests</h2>
          <Link
            href="/admin/agents/requests"
            className="text-sm text-indigo-600 hover:underline"
          >
            Open queue
          </Link>
        </div>
        {requests.length === 0 ? (
          <p className="text-sm text-slate-500">No requests from this agent</p>
        ) : (
          <div className="space-y-4">
            {requests.map((r) => (
              <RequestCard key={r.id} request={r} onUpdate={updateRequest} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function RequestCard({
  request,
  onUpdate,
}: {
  request: any;
  onUpdate: (id: string, data: Record<string, unknown>) => Promise<void>;
}) {
  const [status, setStatus] = useState(request.status);
  const [commission, setCommission] = useState(
    request.commissionAmount ?? ""
  );
  const [bonus, setBonus] = useState(request.bonusAmount ?? "");
  const [payoutStatus, setPayoutStatus] = useState(
    request.payoutStatus || "PENDING"
  );
  const [notes, setNotes] = useState(request.adminNotes || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await onUpdate(request.id, {
        status,
        commissionAmount: commission === "" ? null : Number(commission),
        bonusAmount: bonus === "" ? null : Number(bonus),
        payoutStatus,
        adminNotes: notes || null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">
            {request.type.replace(/_/g, " ")}
          </p>
          <h3 className="font-medium text-slate-900">{request.title}</h3>
          <p className="mt-1 text-sm text-slate-600">{request.description}</p>
          {request.clientName && (
            <p className="mt-1 text-xs text-slate-500">
              Client: {request.clientName} {request.clientPhone}{" "}
              {request.clientEmail}
            </p>
          )}
        </div>
        <span className="text-xs text-slate-500">
          {new Date(request.createdAt).toLocaleString()}
        </span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-5">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded border px-2 py-1.5 text-sm"
        >
          {[
            "PENDING",
            "IN_REVIEW",
            "APPROVED",
            "COMPLETED",
            "REJECTED",
            "CANCELLED",
          ].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Commission"
          value={commission}
          onChange={(e) => setCommission(e.target.value)}
          className="rounded border px-2 py-1.5 text-sm"
        />
        <input
          type="number"
          placeholder="Bonus"
          value={bonus}
          onChange={(e) => setBonus(e.target.value)}
          className="rounded border px-2 py-1.5 text-sm"
        />
        <select
          value={payoutStatus}
          onChange={(e) => setPayoutStatus(e.target.value)}
          className="rounded border px-2 py-1.5 text-sm"
        >
          {["PENDING", "APPROVED", "PAID"].map((s) => (
            <option key={s} value={s}>
              Payout: {s}
            </option>
          ))}
        </select>
        <button
          disabled={saving}
          onClick={save}
          className="rounded bg-indigo-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Update"}
        </button>
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Admin notes"
        rows={2}
        className="mt-2 w-full rounded border px-2 py-1.5 text-sm"
      />
    </div>
  );
}
