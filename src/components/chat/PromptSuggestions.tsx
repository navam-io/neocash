"use client";

import { Target, Zap } from "lucide-react";
import type { Prompt, ChatRecord } from "@/types";

interface PromptSuggestionsProps {
  prompts: Prompt[];
  onSelect: (prompt: Prompt) => void;
  existingGoals?: ChatRecord[];
  onGoalNavigate?: (goalId: string) => void;
  onPreview?: (text: string) => void;
}

export function PromptSuggestions({
  prompts,
  onSelect,
  existingGoals,
  onGoalNavigate,
  onPreview,
}: PromptSuggestionsProps) {
  const hasExistingGoals = existingGoals && existingGoals.length > 0;

  return (
    <div
      className="w-full rounded-xl bg-surface p-1.5"
      style={{ boxShadow: "var(--shadow-dropdown)" }}
    >
      {/* Existing goals section */}
      {hasExistingGoals && (
        <>
          {existingGoals.map((goal) => (
            <button
              key={goal.id}
              onClick={() => onGoalNavigate?.(goal.id)}
              onMouseEnter={() => onPreview?.(goal.goal?.description || goal.title)}
              onMouseLeave={() => onPreview?.("")}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-text-primary transition-colors hover:bg-surface-hover"
            >
              <Target size={14} className={`shrink-0 ${goal.goal?.origin === "custom" ? "text-blue-500" : "text-accent"}`} />
              <span className="truncate">{goal.title}</span>
              {(goal.goal?.signalCount ?? 0) > 0 && (
                <span className="ml-auto flex shrink-0 items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                  <Zap size={10} />
                  {goal.goal!.signalCount}
                </span>
              )}
            </button>
          ))}
          <div className="mx-2 my-1 border-t border-border" />
        </>
      )}

      {/* Goal suggestions */}
      {prompts.map((prompt) => (
        <button
          key={prompt.title}
          onClick={() => onSelect(prompt)}
          onMouseEnter={() => onPreview?.(prompt.text)}
          onMouseLeave={() => onPreview?.("")}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-text-secondary transition-colors hover:bg-surface-hover"
        >
          <Target size={14} className="shrink-0 text-accent/50" />
          <span>{prompt.title}</span>
        </button>
      ))}
    </div>
  );
}
