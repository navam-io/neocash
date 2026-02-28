"use client";

import { useState } from "react";
import { Zap, ChevronDown } from "lucide-react";
import type { ActionItem } from "@/types";

interface DashboardActionItemsProps {
  items: ActionItem[];
  onToggle: (itemId: string) => void;
  onSourceClick?: (signalId: string) => void;
  recentlyCompleted?: Set<string>;
}

const priorityColors: Record<ActionItem["priority"], string> = {
  high: "bg-red-400",
  medium: "bg-amber-400",
  low: "bg-zinc-300",
};

export function DashboardActionItems({
  items,
  onToggle,
  onSourceClick,
  recentlyCompleted,
}: DashboardActionItemsProps) {
  const [showCompleted, setShowCompleted] = useState(false);

  if (items.length === 0) return null;

  const active = items.filter((i) => !i.completed);
  const completed = items.filter((i) => i.completed);
  const total = items.length;
  const completedCount = completed.length;
  const progressPercent = total > 0 ? (completedCount / total) * 100 : 0;

  return (
    <div className="flex flex-col gap-0.5">
      {/* Section header */}
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
          Action Items
        </span>
        <span className="text-[10px] font-semibold text-text-tertiary">
          {completedCount}/{total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mx-3 h-1 rounded-full bg-accent/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Active items */}
      {active.map((item) => (
        <label
          key={item.id}
          className="group flex items-start gap-2 rounded-md px-3 py-1.5 hover:bg-surface-hover/50 transition-colors cursor-pointer"
        >
          <input
            type="checkbox"
            checked={false}
            onChange={() => onToggle(item.id)}
            className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-border accent-accent cursor-pointer"
          />
          <span className="text-xs text-text-secondary leading-snug flex-1 min-w-0">
            {item.text}
          </span>
          <div className="flex items-center gap-1 shrink-0 mt-0.5">
            <span
              className={`h-1.5 w-1.5 rounded-full ${priorityColors[item.priority]}`}
              title={`${item.priority} priority`}
            />
            {item.sourceSignalId && onSourceClick && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onSourceClick(item.sourceSignalId!);
                }}
                className="text-accent/60 hover:text-accent transition-colors opacity-0 group-hover:opacity-100"
                aria-label="View source signal"
              >
                <Zap size={10} />
              </button>
            )}
          </div>
        </label>
      ))}

      {/* Completed toggle */}
      {completed.length > 0 && (
        <>
          <button
            onClick={() => setShowCompleted((p) => !p)}
            className="flex items-center gap-1 px-3 py-1 text-[11px] text-text-tertiary hover:text-text-secondary transition-colors"
          >
            <ChevronDown
              size={12}
              className={`transition-transform ${showCompleted ? "rotate-0" : "-rotate-90"}`}
            />
            {completed.length} completed
          </button>

          {showCompleted &&
            completed.map((item) => (
              <label
                key={item.id}
                className={`group flex items-start gap-2 rounded-md px-3 py-1.5 transition-colors cursor-pointer ${
                  recentlyCompleted?.has(item.id)
                    ? "bg-accent/15 animate-pulse"
                    : "hover:bg-surface-hover/50 opacity-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={true}
                  onChange={() => onToggle(item.id)}
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-border accent-accent cursor-pointer"
                />
                <span className="text-xs text-text-tertiary leading-snug flex-1 min-w-0 line-through">
                  {item.text}
                </span>
              </label>
            ))}
        </>
      )}
    </div>
  );
}
