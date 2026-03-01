"use client";

import { useState } from "react";
import { Brain, ChevronDown } from "lucide-react";

interface ThinkingBlockProps {
  text: string;
  state?: "streaming" | "done";
}

export function ThinkingBlock({ text, state }: ThinkingBlockProps) {
  const [expanded, setExpanded] = useState(false);
  const isStreaming = state === "streaming";

  if (isStreaming) {
    return (
      <div
        className="thinking-block-enter my-1.5 inline-flex items-center gap-2 rounded-lg bg-accent-light px-2.5 py-1 text-xs text-accent"
        role="status"
        aria-label="Claude is thinking"
      >
        <span className="thinking-pulse inline-block h-2 w-2 rounded-full bg-accent" />
        <span className="font-medium">Thinking...</span>
      </div>
    );
  }

  // Done state (or undefined — persisted messages default to done)
  return (
    <div className="thinking-block-enter my-1.5">
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="inline-flex items-center gap-1.5 rounded-lg bg-surface-hover px-2.5 py-1 text-xs text-text-tertiary border border-border transition-colors cursor-pointer select-none hover:bg-surface-active"
      >
        <Brain size={13} className="shrink-0" />
        <span className="font-medium">Thought for a moment</span>
        <ChevronDown
          size={12}
          className={`shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="mt-1 border-l-2 border-accent pl-3 max-h-96 overflow-y-auto">
          <p className="text-sm text-text-tertiary italic whitespace-pre-wrap">
            {text}
          </p>
        </div>
      )}
    </div>
  );
}
