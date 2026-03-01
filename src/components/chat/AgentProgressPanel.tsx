"use client";

import { Loader2, BotMessageSquare } from "lucide-react";
import type { AgentProgressState, AgentStepStatus } from "@/lib/agent-progress-types";

// ─── Helpers ──────────────────────────────────────

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min > 0) return `${min}m ${sec}s`;
  return `${sec}s`;
}

function formatAgentName(name: string): string {
  return name
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function StepIcon({ status }: { status: AgentStepStatus }) {
  switch (status) {
    case "completed":
      return <span className="text-success text-sm leading-none">&#10003;</span>;
    case "running":
      return <Loader2 size={13} className="text-accent animate-spin" />;
    case "failed":
      return <span className="text-red-500 text-sm leading-none">&#10005;</span>;
    case "pending":
    default:
      return <span className="text-text-tertiary text-sm leading-none">&#9675;</span>;
  }
}

function statusText(status: AgentStepStatus, description?: string, lastTool?: string): string {
  switch (status) {
    case "completed":
      return "Done";
    case "running":
      if (lastTool) return `Using ${lastTool.replace(/^mcp__neocash-financial__/, "")}...`;
      if (description) return description.slice(0, 60);
      return "Analyzing...";
    case "failed":
      return "Failed";
    case "pending":
    default:
      return "Waiting...";
  }
}

// ─── Component ────────────────────────────────────

interface AgentProgressPanelProps {
  progress: AgentProgressState;
}

export function AgentProgressPanel({ progress }: AgentProgressPanelProps) {
  const completedCount = progress.steps.filter((s) => s.status === "completed").length;
  const totalCount = progress.steps.length;

  return (
    <div className="my-1.5 rounded-lg border border-accent/20 bg-accent-light overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2">
        <Loader2 size={14} className="text-accent animate-spin shrink-0" />
        <span className="text-xs font-medium text-accent">Running deep analysis...</span>
        <span className="ml-auto text-[10px] text-text-tertiary font-mono">
          {formatElapsed(progress.elapsedMs)}
        </span>
      </div>

      {/* Steps */}
      <div className="border-t border-accent/10 px-3 py-1.5 space-y-1">
        {progress.steps.map((step) => (
          <div key={step.agentName} className="flex items-center gap-2 py-0.5">
            <div className="w-4 flex items-center justify-center shrink-0">
              <StepIcon status={step.status} />
            </div>
            <span className="text-xs font-medium text-text-secondary min-w-0">
              {formatAgentName(step.agentName)}
            </span>
            <span className="text-[10px] text-text-tertiary truncate ml-auto">
              {statusText(step.status, step.description, step.lastTool)}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-accent/10 px-3 py-1.5 flex items-center gap-2">
        <BotMessageSquare size={11} className="text-text-tertiary shrink-0" />
        <span className="text-[10px] text-text-tertiary">
          {completedCount} of {totalCount} agents
        </span>
      </div>
    </div>
  );
}
