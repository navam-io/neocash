"use client";

import { Plus } from "lucide-react";

export function UploadButton() {
  return (
    <button
      type="button"
      aria-label="Attach file"
      className="flex h-8 w-8 items-center justify-center rounded-full text-text-tertiary transition-colors hover:text-text-secondary hover:bg-surface-hover"
    >
      <Plus size={18} />
    </button>
  );
}
