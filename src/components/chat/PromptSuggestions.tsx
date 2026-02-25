"use client";

interface PromptSuggestionsProps {
  prompts: string[];
  onSelect: (prompt: string) => void;
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
          key={prompt}
          onClick={() => onSelect(prompt)}
          className="flex w-full rounded-lg px-3 py-2.5 text-left text-sm text-text-secondary transition-colors hover:bg-surface-hover"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
