"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Target,
  Check,
  Trash2,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { listGoals, deleteGoal } from "@/hooks/useGoalStore";
import type { ChatRecord } from "@/types";

function StatusDot({ status }: { status: string }) {
  if (status === "completed") {
    return <Check size={10} className="shrink-0 text-text-tertiary" />;
  }
  return (
    <span
      className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
        status === "active" ? "bg-green-500" : "bg-amber-400"
      }`}
    />
  );
}

export function GoalList() {
  const {
    activeChatId,
    goalListVersion,
    refreshGoalList,
    refreshChatList,
    refreshDocumentList,
  } = useApp();
  const router = useRouter();
  const [goals, setGoals] = useState<ChatRecord[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => {
    listGoals().then(setGoals);
  }, [goalListVersion]);

  async function handleDelete(id: string) {
    await deleteGoal(id);
    setConfirmingId(null);
    refreshGoalList();
    refreshChatList();
    refreshDocumentList();
    if (activeChatId === id) router.push("/");
  }

  // Don't render section at all if no goals
  if (goals.length === 0) return null;

  return (
    <div className="py-2">
      {/* Section header */}
      <div className="flex items-center px-3 pb-1">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex flex-1 items-center gap-1 text-xs font-medium text-text-tertiary uppercase tracking-wider hover:text-text-secondary transition-colors"
        >
          {collapsed ? (
            <ChevronRight size={12} />
          ) : (
            <ChevronDown size={12} />
          )}
          <span>Goals</span>
          {goals.length > 0 && (
            <span className="ml-auto text-[10px] font-normal tabular-nums">
              {goals.length}
            </span>
          )}
        </button>
      </div>

      {/* Goal items */}
      {!collapsed && goals.length > 0 && (
        <nav
          className="flex flex-col gap-0.5 px-2 max-h-[240px] overflow-y-auto"
          aria-label="Goals"
        >
          {goals.map((goal) =>
            confirmingId === goal.id ? (
              <div
                key={goal.id}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 bg-red-50 text-sm"
              >
                <span className="text-red-700 truncate text-xs">Delete?</span>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => setConfirmingId(null)}
                    className="text-xs text-text-secondary hover:text-text-primary px-1.5 py-0.5"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="text-xs text-red-600 font-medium hover:text-red-700 px-1.5 py-0.5"
                  >
                    Yes
                  </button>
                </div>
              </div>
            ) : (
              <div key={goal.id} className="group relative flex items-center">
                <button
                  onClick={() => router.push(`/chat/${goal.id}`)}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors w-full ${
                    activeChatId === goal.id
                      ? "bg-sidebar-active text-text-primary"
                      : goal.goal?.status === "completed"
                        ? "text-text-secondary opacity-50 hover:bg-sidebar-hover"
                        : "text-text-secondary hover:bg-sidebar-hover"
                  }`}
                >
                  <Target
                    size={14}
                    className={`shrink-0 ${
                      goal.goal?.origin === "custom"
                        ? "text-blue-500"
                        : "text-accent"
                    } ${goal.goal?.status === "completed" ? "opacity-40" : ""}`}
                  />
                  <span className="truncate text-sm flex-1">
                    {goal.title || "New goal"}
                  </span>
                  <StatusDot status={goal.goal?.status || "active"} />
                  {goal.goal && goal.goal.signalCount > 0 && (
                    <span className="text-xs text-text-tertiary tabular-nums">
                      {goal.goal.signalCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmingId(goal.id);
                  }}
                  className="absolute right-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-100"
                  aria-label="Delete goal"
                >
                  <Trash2 size={12} className="text-text-tertiary hover:text-red-500" />
                </button>
              </div>
            ),
          )}
        </nav>
      )}
    </div>
  );
}
