"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { Loader2 } from "lucide-react";

type RequestRow = {
  id: string;
  type: string;
  status: string;
  title: string;
  description: string;
  commissionAmount: number | null;
  bonusAmount: number | null;
  createdAt: string;
  agent: {
    id: string;
    name: string | null;
    email: string;
    agentProfile: {
      id: string;
      businessName: string;
      isGolden: boolean;
      trustScore: number;
    } | null;
  };
};

export default function AdminAgentRequestsPage() {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("PENDING");
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: "50" });
      if (status) params.set("status", status);
      const res = await axios.get(`/api/admin/agents/requests?${params}`, {
        headers: { "x-admin-auth": "true" },
      });
      setRequests(res.data.requests || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const quickUpdate = async (
    id: string,
    data: { status?: string; commissionAmount?: number | null; bonusAmount?: number | null }
  ) => {
    setSavingId(id);
    try {
      await axios.patch(`/api/admin/agents/requests/${id}`, data, {
        headers: { "x-admin-auth": "true" },
      });
      await load();
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agent requests</h1>
          <p className="text-sm text-slate-500">
            Review submissions from agent dashboards
          </p>
        </div>
        <Link href="/admin/agents" className="text-sm text-indigo-600 hover:underline">
          All agents
        </Link>
      </div>

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
      >
        <option value="">All statuses</option>
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

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : requests.length === 0 ? (
          <p className="py-16 text-center text-slate-500">No requests</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Agent</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="px-4 py-3">
                    {r.agent.agentProfile ? (
                      <Link
                        href={`/admin/agents/${r.agent.agentProfile.id}`}
                        className="font-medium text-indigo-600 hover:underline"
                      >
                        {r.agent.agentProfile.businessName}
                      </Link>
                    ) : (
                      r.agent.email
                    )}
                    <div className="text-xs text-slate-500">{r.agent.email}</div>
                  </td>
                  <td className="px-4 py-3">{r.type.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.title}</div>
                    <div className="line-clamp-2 text-xs text-slate-500">
                      {r.description}
                    </div>
                  </td>
                  <td className="px-4 py-3">{r.status}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <button
                        disabled={savingId === r.id}
                        onClick={() =>
                          quickUpdate(r.id, { status: "IN_REVIEW" })
                        }
                        className="rounded border px-2 py-1 text-xs"
                      >
                        Review
                      </button>
                      <button
                        disabled={savingId === r.id}
                        onClick={() =>
                          quickUpdate(r.id, { status: "APPROVED" })
                        }
                        className="rounded bg-emerald-600 px-2 py-1 text-xs text-white"
                      >
                        Approve
                      </button>
                      <button
                        disabled={savingId === r.id}
                        onClick={() =>
                          quickUpdate(r.id, { status: "REJECTED" })
                        }
                        className="rounded bg-red-600 px-2 py-1 text-xs text-white"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
