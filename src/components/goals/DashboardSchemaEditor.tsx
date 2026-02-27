"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";
import type { DashboardAttribute, DashboardAttributeType, DashboardSchema } from "@/types";

const ATTRIBUTE_TYPES: { value: DashboardAttributeType; label: string }[] = [
  { value: "currency", label: "Currency ($)" },
  { value: "percent", label: "Percent (%)" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "text", label: "Text" },
  { value: "boolean", label: "Yes/No" },
];

interface DashboardSchemaEditorProps {
  schema: DashboardSchema;
  onSave: (schema: DashboardSchema) => void;
  onCancel: () => void;
}

export function DashboardSchemaEditor({
  schema,
  onSave,
  onCancel,
}: DashboardSchemaEditorProps) {
  const [attrs, setAttrs] = useState<DashboardAttribute[]>(() =>
    schema.map((a) => ({ ...a })),
  );

  function updateAttr(id: string, updates: Partial<DashboardAttribute>) {
    setAttrs((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    );
  }

  function addAttr() {
    if (attrs.length >= 8) return;
    setAttrs((prev) => [
      ...prev,
      {
        id: nanoid(6),
        name: "",
        type: "text" as DashboardAttributeType,
      },
    ]);
  }

  function removeAttr(id: string) {
    if (attrs.length <= 1) return;
    setAttrs((prev) => prev.filter((a) => a.id !== id));
  }

  function handleSave() {
    // Filter out attributes with empty names
    const valid = attrs.filter((a) => a.name.trim());
    if (valid.length === 0) return;
    onSave(valid);
  }

  return (
    <div className="flex flex-col gap-3 px-3">
      <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider px-1">
        Edit Attributes
      </span>

      {attrs.map((attr) => (
        <div key={attr.id} className="flex flex-col gap-1.5 rounded-lg bg-page-bg p-2.5">
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={attr.name}
              onChange={(e) => updateAttr(attr.id, { name: e.target.value })}
              placeholder="Attribute name"
              className="flex-1 rounded-md border border-border bg-surface px-2 py-1 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button
              onClick={() => removeAttr(attr.id)}
              disabled={attrs.length <= 1}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-text-tertiary hover:text-error hover:bg-error/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Remove attribute"
            >
              <Trash2 size={12} />
            </button>
          </div>
          <div className="flex gap-1.5">
            <select
              value={attr.type}
              onChange={(e) =>
                updateAttr(attr.id, {
                  type: e.target.value as DashboardAttributeType,
                })
              }
              className="flex-1 rounded-md border border-border bg-surface px-2 py-1 text-xs text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {ATTRIBUTE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <input
            type="text"
            value={attr.description || ""}
            onChange={(e) =>
              updateAttr(attr.id, { description: e.target.value || undefined })
            }
            placeholder="Description (optional)"
            className="rounded-md border border-border bg-surface px-2 py-1 text-[11px] text-text-secondary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      ))}

      {/* Add button */}
      <button
        onClick={addAttr}
        disabled={attrs.length >= 8}
        className="flex items-center justify-center gap-1 rounded-md border border-dashed border-border py-1.5 text-xs text-text-tertiary hover:text-text-secondary hover:border-border-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Plus size={12} />
        Add attribute
      </button>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSave}
          className="flex-1 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover transition-colors"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="rounded-md px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-hover transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
