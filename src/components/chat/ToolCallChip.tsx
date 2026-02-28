"use client";

import { useState } from "react";
import { Loader2, Check, AlertCircle, ChevronDown } from "lucide-react";
import { getToolLabel } from "@/lib/tool-labels";

interface ToolCallChipProps {
  toolName: string;
  state: string;
  input?: unknown;
  output?: unknown;
  isError?: boolean;
}

export function ToolCallChip({
  toolName,
  state,
  input,
  output,
  isError,
}: ToolCallChipProps) {
  const [expanded, setExpanded] = useState(false);
  const label = getToolLabel(toolName);
  const isWorking = state === "input-streaming" || state === "input-available";
  const isDone = state === "output-available" || state === "output-error" || state === "output-denied";
  const isWrite = label.category === "write";

  const displayText = isError
    ? "Error"
    : isWorking
      ? label.activeLabel
      : isDone
        ? label.doneLabel
        : label.label;

  const Icon = label.icon;

  return (
    <div className="tool-chip-enter my-1.5">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`
          inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs
          transition-colors cursor-pointer select-none
          ${isError
            ? "bg-red-50 text-red-700 border border-red-200"
            : isWorking
              ? "bg-accent-light text-accent border border-accent/20"
              : isDone && isWrite
                ? "bg-accent-muted text-text-secondary border border-accent/10"
                : "bg-surface-hover text-text-tertiary border border-border"
          }
        `}
      >
        {isError ? (
          <AlertCircle size={13} className="shrink-0" />
        ) : isWorking ? (
          <Loader2 size={13} className="shrink-0 animate-spin" />
        ) : isDone ? (
          <Check size={13} className="shrink-0 text-success" />
        ) : (
          <Icon size={13} className="shrink-0" />
        )}

        <span className="font-medium">{displayText}</span>

        {isDone && (
          <ChevronDown
            size={12}
            className={`shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {expanded && isDone && (
        <div className="mt-1 rounded-lg border border-border bg-surface-hover p-2 text-xs font-mono text-text-tertiary overflow-x-auto max-h-48 overflow-y-auto">
          {input != null && (
            <div className="mb-1.5">
              <span className="font-sans font-medium text-text-secondary">Input:</span>
              <pre className="mt-0.5 whitespace-pre-wrap break-words">
                {String(JSON.stringify(input, null, 2))}
              </pre>
            </div>
          )}
          {output != null && (
            <div>
              <span className="font-sans font-medium text-text-secondary">Output:</span>
              <pre className="mt-0.5 whitespace-pre-wrap break-words">
                {String(JSON.stringify(output, null, 2))}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
