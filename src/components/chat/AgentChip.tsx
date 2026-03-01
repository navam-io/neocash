"use client";

import { Receipt, TrendingUp, Wallet, Shield, Sparkles } from "lucide-react";
import { getAgentProfile, type AgentId } from "@/lib/agent-profiles";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Receipt,
  TrendingUp,
  Wallet,
  Shield,
  Sparkles,
};

interface AgentChipProps {
  agentId: AgentId;
}

export function AgentChip({ agentId }: AgentChipProps) {
  if (agentId === "generalist") return null;
  const profile = getAgentProfile(agentId);
  const Icon = iconMap[profile.icon] ?? Sparkles;

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium mb-2">
      <Icon className="w-3.5 h-3.5" />
      {profile.name}
    </div>
  );
}
