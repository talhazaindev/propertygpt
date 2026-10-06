"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, UserCheck } from "lucide-react";

type ActiveAgent = {
  userId: string;
  businessName: string;
  name: string | null;
  email: string;
  location: string;
  trustScore: number;
  isGolden: boolean;
};

export default function AssignAgentPanel({
  propertyId,
  adminPreparedAt,
  assignedAgent,
  agentVerificationStatus,
  agentVerificationNotes,
  onUpdated,
}: {
  propertyId: string;
  adminPreparedAt?: string | Date | null;
  assignedAgent?: {
    id: string;
    name?: string | null;
    email?: string;
    agentProfile?: { businessName?: string } | null;
  } | null;
  agentVerificationStatus?: string | null;
  agentVerificationNotes?: string | null;
  onUpdated: () => void;
}) {
  const [agents, setAgents] = useState<ActiveAgent[]>([]);
  const [selected, setSelected] = useState(assignedAgent?.id || "");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get("/api/admin/agents/active", {
          headers: { "x-admin-auth": "true" },
        });
        setAgents(res.data.agents || []);
      } catch {
        toast.error("Failed to load agents");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    setSelected(assignedAgent?.id || "");
  }, [assignedAgent?.id]);

  const assign = async (agentId: string | null) => {
    try {
      setSaving(true);
      await axios.post(
        `/api/admin/properties/${propertyId}/assign`,
        { agentId },
        { headers: { "x-admin-auth": "true" } }
      );
      toast.success(agentId ? "Assigned to agent" : "Agent unassigned");
      onUpdated();
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Assignment failed";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 border-t border-gray-200 bg-indigo-50/40">
      <div className="flex items-start gap-3 mb-4">
        <UserCheck className="h-5 w-5 text-indigo-600 mt-0.5" />
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Assign agent for verification
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Edit and save all listing details first, then assign an active Manzil
            agent. They will see this property on their dashboard to verify.
          </p>
        </div>
      </div>

      <div className="mb-3 text-sm">
        {adminPreparedAt ? (
          <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-800">
            Details prepared {new Date(adminPreparedAt).toLocaleString()}
          </span>
        ) : (
          <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">
            Save edits below before assigning
          </span>
        )}
        {agentVerificationStatus && agentVerificationStatus !== "NONE" && (
          <span className="ml-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
            Agent status: {agentVerificationStatus}
          </span>
        )}
      </div>

      {assignedAgent && (
        <p className="mb-3 text-sm text-gray-700">
          Currently assigned:{" "}
          <strong>
            {assignedAgent.agentProfile?.businessName || assignedAgent.name} (
            {assignedAgent.email})
          </strong>
        </p>
      )}

      {agentVerificationNotes && (
        <div className="mb-4 rounded-lg border border-indigo-100 bg-white p-3 text-sm text-gray-700">
          <p className="font-medium text-gray-900">Agent verification notes</p>
          <p className="mt-1 whitespace-pre-wrap">{agentVerificationNotes}</p>
        </div>
      )}

      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
      ) : (
        <div className="flex flex-wrap gap-2">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="min-w-[260px] flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Select an active agent…</option>
            {agents.map((a) => (
              <option key={a.userId} value={a.userId}>
                {a.businessName} — {a.name || a.email} (score {a.trustScore}
                {a.isGolden ? ", Golden" : ""})
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={saving || !selected || !adminPreparedAt}
            onClick={() => assign(selected)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Assigning…" : "Assign agent"}
          </button>
          {assignedAgent && (
            <button
              type="button"
              disabled={saving}
              onClick={() => assign(null)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm"
            >
              Unassign
            </button>
          )}
        </div>
      )}
    </div>
  );
}
