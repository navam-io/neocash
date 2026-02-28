"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Brain } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { listMemoriesByType } from "@/hooks/useMemoryStore";
import type { MemoryRecord } from "@/types";

const CATEGORY_COLORS: Record<string, string> = {
  income: "text-green-700 bg-green-50",
  tax: "text-blue-700 bg-blue-50",
  accounts: "text-purple-700 bg-purple-50",
  debt: "text-red-700 bg-red-50",
  family: "text-pink-700 bg-pink-50",
  employment: "text-amber-700 bg-amber-50",
  property: "text-teal-700 bg-teal-50",
  goals: "text-indigo-700 bg-indigo-50",
  general: "text-gray-700 bg-gray-50",
};

interface MemoryListProps {
  onOpenEditor: () => void;
}

export function MemoryList({ onOpenEditor }: MemoryListProps) {
  const { memoryListVersion } = useApp();
  const [facts, setFacts] = useState<MemoryRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    async function load() {
      const allFacts = await listMemoriesByType("fact");
      setFacts(allFacts.slice(0, 5));
      const decisions = await listMemoriesByType("decision");
      setTotalCount(allFacts.length + decisions.length);
    }
    load();
  }, [memoryListVersion]);

  if (totalCount === 0) return null;

  return (
    <div className="py-2">
      {/* Section header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center gap-1 px-3 pb-1 text-xs font-medium text-text-tertiary uppercase tracking-wider hover:text-text-secondary transition-colors"
      >
        {collapsed ? (
          <ChevronRight size={12} />
        ) : (
          <ChevronDown size={12} />
        )}
        <span>Memory</span>
        <span className="ml-auto text-[10px] font-normal tabular-nums">
          {totalCount}
        </span>
      </button>

      {/* Memory items */}
      {!collapsed && (
        <nav
          className="flex flex-col gap-0.5 px-2 max-h-[200px] overflow-y-auto"
          aria-label="Memories"
        >
          {facts.map((mem) => (
            <div
              key={mem.id}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left"
            >
              <Brain size={14} className="text-accent shrink-0 opacity-60" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-block rounded px-1 py-0.5 text-[9px] font-medium leading-none ${
                      CATEGORY_COLORS[mem.category] || CATEGORY_COLORS.general
                    }`}
                  >
                    {mem.category}
                  </span>
                  <span className="text-xs text-text-secondary truncate">
                    {mem.value}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* View all link */}
          <button
            onClick={onOpenEditor}
            className="flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs text-accent hover:bg-sidebar-hover transition-colors"
          >
            View all...
          </button>
        </nav>
      )}
    </div>
  );
}
