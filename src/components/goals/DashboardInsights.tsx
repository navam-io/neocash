"use client";

import { AlertTriangle, AlertCircle, TrendingUp, Lightbulb, X, Zap } from "lucide-react";
import type { Insight, InsightType } from "@/types";

interface DashboardInsightsProps {
  insights: Insight[];
  onDismiss: (insightId: string) => void;
  onSourceClick?: (signalId: string) => void;
}

const typeConfig: Record<InsightType, {
  icon: typeof AlertTriangle;
  color: string;
  sortOrder: number;
}> = {
  warning: { icon: AlertTriangle, color: "text-red-500", sortOrder: 0 },
  missing_info: { icon: AlertCircle, color: "text-amber-500", sortOrder: 1 },
  opportunity: { icon: TrendingUp, color: "text-emerald-500", sortOrder: 2 },
  recommendation: { icon: Lightbulb, color: "text-blue-500", sortOrder: 3 },
};

export function DashboardInsights({
  insights,
  onDismiss,
  onSourceClick,
}: DashboardInsightsProps) {
  const active = insights
    .filter((i) => !i.dismissedAt)
    .sort((a, b) => typeConfig[a.type].sortOrder - typeConfig[b.type].sortOrder);

  if (active.length === 0) return null;

  return (
    <div className="flex flex-col gap-0.5">
      {/* Section header */}
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
          Insights
        </span>
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent/15 px-1 text-[10px] font-semibold text-accent">
          {active.length}
        </span>
      </div>

      {active.map((insight) => {
        const config = typeConfig[insight.type];
        const Icon = config.icon;

        return (
          <div
            key={insight.id}
            className="group flex items-start gap-2 rounded-md px-3 py-1.5 hover:bg-surface-hover/50 transition-colors"
          >
            <Icon size={13} className={`shrink-0 mt-0.5 ${config.color}`} />
            <span className="text-xs text-text-secondary leading-snug flex-1 min-w-0">
              {insight.text}
            </span>
            <div className="flex items-center gap-1 shrink-0 mt-0.5">
              {insight.sourceSignalId && onSourceClick && (
                <button
                  onClick={() => onSourceClick(insight.sourceSignalId!)}
                  className="text-accent/60 hover:text-accent transition-colors opacity-0 group-hover:opacity-100"
                  aria-label="View source signal"
                >
                  <Zap size={10} />
                </button>
              )}
              <button
                onClick={() => onDismiss(insight.id)}
                className="text-text-tertiary hover:text-text-secondary transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Dismiss insight"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
