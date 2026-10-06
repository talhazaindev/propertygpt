"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { Loader2 } from "lucide-react";
import AgentTrustProfile, {
  AgentTrustProfileData,
} from "@/components/agent/AgentTrustProfile";

export default function PublicAgentPage() {
  const params = useParams();
  const id = params.id as string;
  const [agent, setAgent] = useState<AgentTrustProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/agents/${id}`);
        setAgent(res.data.agent);
      } catch {
        setError("This agent profile is not available.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-serif text-2xl font-semibold">Agent not found</h1>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <Link href="/properties" className="mt-6 inline-block text-primary hover:underline">
          Browse properties
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <p className="text-sm font-medium uppercase tracking-wider text-primary">
        Manzil network
      </p>
      <h1 className="mt-2 font-serif text-4xl font-semibold text-foreground">
        {agent.businessName}
      </h1>
      {agent.location && (
        <p className="mt-2 text-muted-foreground">{agent.location}</p>
      )}
      <div className="mt-8">
        <AgentTrustProfile agent={agent} />
      </div>
    </div>
  );
}
