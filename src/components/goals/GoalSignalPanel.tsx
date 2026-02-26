"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Radio, Target, Zap } from "lucide-react";
import type { GoalMeta, GoalStatus, SignalRecord } from "@/types";

interface GoalSignalPanelProps {
  title: string;
  goal: GoalMeta;
  signals: SignalRecord[];
  onStatusChange: (status: GoalStatus) => void;
  onTogglePollinate: () => void;
}

export function GoalSignalPanel({
  title,
  goal,
  signals,
  onStatusChange,
  onTogglePollinate,
}: GoalSignalPanelProps) {
  const router = useRouter();
  const [signalsExpanded, setSignalsExpanded] = useState(false);
  const captureDisabled = goal.status !== "active";

  return (
    <div className="border-b border-border bg-accent/5 px-4 py-3">
      <div className="mx-auto max-w-2xl flex flex-wrap items-center gap-3">
        {/* Goal title */}
        <div className="flex items-center gap-1.5">
          <Target size={14} className="shrink-0 text-accent" />
          <span className="text-sm font-semibold text-text-primary truncate max-w-[200px]">
            {title}
          </span>
        </div>
        <div className="h-4 w-px bg-border" />

        {/* Status badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
            Status
          </span>
          <select
            value={goal.status}
            onChange={(e) => onStatusChange(e.target.value as GoalStatus)}
            className="rounded-md bg-surface border border-border px-2 py-0.5 text-xs text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Signal capture toggle */}
        <div
          onClick={captureDisabled ? undefined : onTogglePollinate}
          onKeyDown={captureDisabled ? undefined : (e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              onTogglePollinate();
            }
          }}
          tabIndex={captureDisabled ? -1 : 0}
          className={`flex items-center gap-1.5 ${captureDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
          role="switch"
          aria-checked={goal.crossPollinate}
          aria-disabled={captureDisabled}
          aria-label="Capture signals"
        >
          <Radio
            size={12}
            className={goal.crossPollinate && !captureDisabled ? "text-accent" : "text-text-tertiary"}
          />
          <span className="text-xs text-text-secondary">
            Capture signals
          </span>
          <span
            className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
              goal.crossPollinate && !captureDisabled ? "bg-accent" : "bg-border"
            }`}
          >
            <span
              className={`inline-block h-3 w-3 rounded-full bg-white transition-transform ${
                goal.crossPollinate && !captureDisabled ? "translate-x-3.5" : "translate-x-0.5"
              }`}
            />
          </span>
        </div>

        {/* Signal count */}
        {signals.length > 0 && (
          <button
            onClick={() => setSignalsExpanded(!signalsExpanded)}
            className="flex items-center gap-1 text-xs text-text-tertiary hover:text-text-secondary transition-colors ml-auto"
          >
            <Zap size={12} className="text-accent" />
            <span>{signals.length} signal{signals.length !== 1 ? "s" : ""}</span>
            {signalsExpanded ? (
              <ChevronDown size={12} />
            ) : (
              <ChevronRight size={12} />
            )}
          </button>
        )}
      </div>

      {/* Expanded signal list */}
      {signalsExpanded && signals.length > 0 && (
        <div className="mx-auto max-w-2xl mt-2 flex flex-col gap-1.5">
          {signals.map((signal) => (
            <div
              key={signal.id}
              className="flex items-start gap-2 rounded-md bg-surface/50 px-3 py-2 text-xs"
            >
              <span className="shrink-0 rounded-full bg-accent/10 text-accent px-1.5 py-0.5 text-[10px] font-medium">
                {signal.category}
              </span>
              <span className="flex-1 text-text-secondary">
                {signal.summary}
              </span>
              <button
                onClick={() => router.push(`/chat/${signal.sourceChatId}`)}
                className="shrink-0 text-accent hover:underline"
              >
                View source
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
