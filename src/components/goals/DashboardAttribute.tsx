"use client";

import { Check, X, Zap } from "lucide-react";
import type {
  DashboardAttribute as DashboardAttributeType,
  DashboardValue,
} from "@/types";

interface DashboardAttributeProps {
  attribute: DashboardAttributeType;
  value?: DashboardValue;
  onSourceClick?: (signalId: string) => void;
}

function formatValue(
  type: DashboardAttributeType["type"],
  value: string | number | boolean,
): React.ReactNode {
  switch (type) {
    case "currency": {
      const num = typeof value === "number" ? value : parseFloat(String(value));
      if (isNaN(num)) return String(value);
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(num);
    }
    case "percent": {
      const num = typeof value === "number" ? value : parseFloat(String(value));
      if (isNaN(num)) return String(value);
      return `${num}%`;
    }
    case "date": {
      const str = String(value);
      // Parse YYYY-MM-DD directly to avoid UTC→local timezone off-by-one
      const parts = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (parts) {
        const date = new Date(+parts[1], +parts[2] - 1, +parts[3]);
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }
      const date = new Date(str);
      if (isNaN(date.getTime())) return str;
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    case "boolean": {
      const bool =
        typeof value === "boolean"
          ? value
          : String(value).toLowerCase() === "true";
      return bool ? (
        <Check size={14} className="text-success" />
      ) : (
        <X size={14} className="text-text-tertiary" />
      );
    }
    case "number": {
      const num = typeof value === "number" ? value : parseFloat(String(value));
      if (isNaN(num)) return String(value);
      return new Intl.NumberFormat("en-US").format(num);
    }
    default:
      return String(value);
  }
}

export function DashboardAttribute({
  attribute,
  value,
  onSourceClick,
}: DashboardAttributeProps) {
  const hasValue = value !== undefined && value.value !== undefined;

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-md hover:bg-surface-hover/50 transition-colors">
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-medium text-text-secondary truncate">
          {attribute.name}
        </span>
        {attribute.description && (
          <span className="text-[10px] text-text-tertiary truncate">
            {attribute.description}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {hasValue ? (
          <>
            <span className="text-sm font-semibold text-text-primary tabular-nums">
              {formatValue(attribute.type, value.value)}
            </span>
            {value.sourceSignalId && onSourceClick && (
              <button
                onClick={() => onSourceClick(value.sourceSignalId!)}
                className="text-accent/60 hover:text-accent transition-colors"
                aria-label="View source signal"
              >
                <Zap size={10} />
              </button>
            )}
          </>
        ) : (
          <span className="text-sm text-text-tertiary">--</span>
        )}
      </div>
    </div>
  );
}
