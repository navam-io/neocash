"use client";

import { ArrowUp, Square } from "lucide-react";

interface SendButtonProps {
  isLoading: boolean;
  hasContent: boolean;
  onStop?: () => void;
}

export function SendButton({ isLoading, hasContent, onStop }: SendButtonProps) {
  if (isLoading) {
    return (
      <button
        type="button"
        onClick={onStop}
        aria-label="Stop generating"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-text-primary text-text-inverse transition-colors hover:bg-text-secondary"
      >
        <Square size={14} fill="currentColor" />
      </button>
    );
  }

  return (
    <button
      type="submit"
      disabled={!hasContent}
      aria-label="Send message"
      className="flex h-8 w-8 items-center justify-center rounded-full bg-text-primary text-text-inverse transition-colors hover:bg-text-secondary disabled:opacity-30 disabled:cursor-not-allowed"
    >
      <ArrowUp size={16} strokeWidth={2.5} />
    </button>
  );
}
