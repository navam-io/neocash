"use client";

export function LoadingDots() {
  return (
    <div className="flex items-center gap-1 py-1" aria-label="Thinking...">
      <span className="loading-dot h-2 w-2 rounded-full bg-text-tertiary" />
      <span className="loading-dot h-2 w-2 rounded-full bg-text-tertiary" />
      <span className="loading-dot h-2 w-2 rounded-full bg-text-tertiary" />
    </div>
  );
}
