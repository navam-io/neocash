"use client";

import { useState } from "react";
import { X, Settings } from "lucide-react";
import { DashboardAttribute } from "./DashboardAttribute";
import { DashboardActionItems } from "./DashboardActionItems";
import { DashboardInsights } from "./DashboardInsights";
import { DashboardSchemaEditor } from "./DashboardSchemaEditor";
import type {
  ActionItem,
  DashboardSchema,
  DashboardValues,
  Insight,
  DashboardAttribute as DashboardAttrType,
} from "@/types";

interface GoalDashboardPanelProps {
  schema: DashboardSchema;
  values: DashboardValues;
  actionItems?: ActionItem[];
  insights?: Insight[];
  onClose: () => void;
  onSaveSchema: (schema: DashboardSchema) => void;
  onToggleActionItem?: (itemId: string) => void;
  onDismissInsight?: (insightId: string) => void;
  onSourceClick?: (signalId: string) => void;
  isMobile?: boolean;
}

export function GoalDashboardPanel({
  schema,
  values,
  actionItems,
  insights,
  onClose,
  onSaveSchema,
  onToggleActionItem,
  onDismissInsight,
  onSourceClick,
  isMobile,
}: GoalDashboardPanelProps) {
  const [editing, setEditing] = useState(false);

  const trackedCount = schema.filter((attr) => values[attr.id] !== undefined).length;

  const handleSaveSchema = (newSchema: DashboardSchema) => {
    onSaveSchema(newSchema);
    setEditing(false);
  };

  const panelContent = (
    <div className="flex h-full flex-col bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-sm font-semibold text-text-primary">Dashboard</span>
        <div className="flex items-center gap-1">
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-text-tertiary hover:text-text-secondary hover:bg-surface-hover transition-colors"
              aria-label="Edit schema"
            >
              <Settings size={14} />
            </button>
          )}
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-md text-text-tertiary hover:text-text-secondary hover:bg-surface-hover transition-colors"
            aria-label="Close dashboard"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto py-2">
        {editing ? (
          <DashboardSchemaEditor
            schema={schema}
            onSave={handleSaveSchema}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <div className="flex flex-col">
            {/* Metrics */}
            <div className="flex flex-col gap-0.5">
              {schema.map((attr: DashboardAttrType) => (
                <DashboardAttribute
                  key={attr.id}
                  attribute={attr}
                  value={values[attr.id]}
                  onSourceClick={onSourceClick}
                />
              ))}
            </div>

            {/* Action Items */}
            {actionItems && actionItems.length > 0 && onToggleActionItem && (
              <>
                <div className="mx-3 my-2 border-t border-border" />
                <DashboardActionItems
                  items={actionItems}
                  onToggle={onToggleActionItem}
                  onSourceClick={onSourceClick}
                />
              </>
            )}

            {/* Insights */}
            {insights && insights.some((i) => !i.dismissedAt) && onDismissInsight && (
              <>
                <div className="mx-3 my-2 border-t border-border" />
                <DashboardInsights
                  insights={insights}
                  onDismiss={onDismissInsight}
                  onSourceClick={onSourceClick}
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {!editing && (
        <div className="border-t border-border px-4 py-2">
          <span className="text-[11px] text-text-tertiary">
            {trackedCount} of {schema.length} tracked
            {actionItems && actionItems.length > 0 && (
              <> · {actionItems.filter((a) => !a.completed).length} actions</>
            )}
            {insights && insights.filter((i) => !i.dismissedAt).length > 0 && (
              <> · {insights.filter((i) => !i.dismissedAt).length} insights</>
            )}
          </span>
        </div>
      )}
    </div>
  );

  // Mobile: bottom sheet overlay
  if (isMobile) {
    return (
      <>
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={onClose}
        />
        <div className="fixed inset-x-0 bottom-0 z-50 max-h-[70vh] rounded-t-xl shadow-dropdown">
          {panelContent}
        </div>
      </>
    );
  }

  // Desktop: right-side panel
  return (
    <div className="flex w-[320px] shrink-0 flex-col border-l border-border">
      {panelContent}
    </div>
  );
}
