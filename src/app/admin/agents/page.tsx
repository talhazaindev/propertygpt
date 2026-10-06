"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Search, Award, Loader2 } from "lucide-react";

type AgentRow = {
  id: string;
  businessName: string;
  location: string;
  status: string;
  trustScore: number;
  isGolden: boolean;
  pendingRequestCount: number;
  phoneNumber: string;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
};

const STATUSES = ["", "PENDING", "ACTIVE", "SUSPENDED", "REJECTED"];

export default function AdminAgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [isGolden, setIsGolden] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (query) params.set("query", query);
      if (status) params.set("status", status);
      if (isGolden) params.set("isGolden", isGolden);
      const res = await axios.get(`/api/admin/agents?${params}`, {
        headers: { "x-admin-auth": "true" },
      });
      setAgents(res.data.agents || []);
      setPages(res.data.pagination?.pages || 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, query, status, isGolden]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agents</h1>
          <p className="text-sm text-slate-500">
            Applications, reputation, and Golden Agents
          </p>
        </div>
        <Link
          href="/admin/agents/requests"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Request queue
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => {
              setPage(1);
              setQuery(e.target.value);
            }}
            placeholder="Search name, email, business..."
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {STATUSES.filter(Boolean).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={isGolden}
          onChange={(e) => {
            setPage(1);
            setIsGolden(e.target.value);
          }}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">All agents</option>
          <option value="true">Golden only</option>
          <option value="false">Non-golden</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : agents.length === 0 ? (
          <p className="py-16 text-center text-slate-500">No agents found</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Agent</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Trust</th>
                <th className="px-4 py-3 font-medium">Pending</th>
                <th className="px-4 py-3 font-medium">Location</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr
                  key={agent.id}
                  onClick={() => router.push(`/admin/agents/${agent.id}`)}
                  className="cursor-pointer border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-medium text-slate-900">
                      {agent.businessName}
                      {agent.isGolden && (
                        <Award className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      {agent.user.name} · {agent.user.email}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        agent.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-800"
                          : agent.status === "PENDING"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {agent.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold">{agent.trustScore}/100</td>
                  <td className="px-4 py-3">{agent.pendingRequestCount}</td>
                  <td className="px-4 py-3 text-slate-600">{agent.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="px-3 py-1.5 text-sm text-slate-600">
            Page {page} of {pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
