"use client";

import type { Prompt } from "@/types";

interface PromptSuggestionsProps {
  prompts: Prompt[];
  onSelect: (prompt: Prompt) => void;
}

export function PromptSuggestions({
  prompts,
  onSelect,
}: PromptSuggestionsProps) {
  return (
    <div
      className="w-full rounded-xl bg-surface p-1.5"
      style={{ boxShadow: "var(--shadow-dropdown)" }}
    >
      {prompts.map((prompt) => (
        <button
          key={prompt.title}
          onClick={() => onSelect(prompt)}
          className="flex w-full rounded-lg px-3 py-2.5 text-left text-sm text-text-secondary transition-colors hover:bg-surface-hover"
        >
          {prompt.title}
        </button>
      ))}
    </div>
  );
}
