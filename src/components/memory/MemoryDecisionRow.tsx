"use client";

import { useState } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import type { MemoryRecord, MemoryCategory } from "@/types";

const CATEGORY_OPTIONS: { value: MemoryCategory; label: string }[] = [
  { value: "income", label: "Income" },
  { value: "tax", label: "Tax" },
  { value: "accounts", label: "Accounts" },
  { value: "debt", label: "Debt" },
  { value: "family", label: "Family" },
  { value: "employment", label: "Employment" },
  { value: "property", label: "Property" },
  { value: "goals", label: "Goals" },
  { value: "general", label: "General" },
];

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

interface MemoryDecisionRowProps {
  memory: MemoryRecord;
  onSave: (id: string, updates: { value: string; context?: string; category: MemoryCategory }) => void;
  onDelete: (id: string) => void;
}

export function MemoryDecisionRow({ memory, onSave, onDelete }: MemoryDecisionRowProps) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [value, setValue] = useState(memory.value);
  const [context, setContext] = useState(memory.context || "");
  const [category, setCategory] = useState(memory.category);

  function handleSave() {
    if (!value.trim()) return;
    onSave(memory.id, {
      value: value.trim(),
      context: context.trim() || undefined,
      category,
    });
    setEditing(false);
  }

  function handleCancel() {
    setValue(memory.value);
    setContext(memory.context || "");
    setCategory(memory.category);
    setEditing(false);
  }

  const dateStr = new Date(memory.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  if (confirming) {
    return (
      <div className="flex items-center justify-between rounded-lg px-3 py-2 bg-red-50">
        <span className="text-xs text-red-700 truncate">Delete this decision?</span>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => setConfirming(false)}
            className="text-xs text-text-secondary hover:text-text-primary px-1.5 py-0.5"
          >
            Cancel
          </button>
          <button
            onClick={() => onDelete(memory.id)}
            className="text-xs text-red-600 font-medium hover:text-red-700 px-1.5 py-0.5"
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-1.5 rounded-lg bg-page-bg p-2.5">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Decision"
          className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
          autoFocus
        />
        <input
          type="text"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Rationale (optional)"
          className="rounded-md border border-border bg-surface px-2 py-1 text-[11px] text-text-secondary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as MemoryCategory)}
          className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent"
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="flex gap-1.5 justify-end">
          <button
            onClick={handleSave}
            className="flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-xs font-medium text-white hover:bg-accent-hover transition-colors"
          >
            <Check size={10} />
            Save
          </button>
          <button
            onClick={handleCancel}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-text-secondary hover:bg-surface-hover transition-colors"
          >
            <X size={10} />
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-start gap-2 rounded-lg px-3 py-2 hover:bg-page-bg transition-colors">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span
            className={`inline-block shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium leading-none ${
              CATEGORY_COLORS[memory.category] || CATEGORY_COLORS.general
            }`}
          >
            {memory.category}
          </span>
          <span className="text-[10px] text-text-tertiary">{dateStr}</span>
        </div>
        <p className="text-xs text-text-primary">{memory.value}</p>
        {memory.context && (
          <p className="text-[11px] text-text-tertiary mt-0.5">{memory.context}</p>
        )}
      </div>
      <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity pt-0.5">
        <button
          onClick={() => setEditing(true)}
          className="p-1 rounded hover:bg-surface-hover"
          aria-label="Edit decision"
        >
          <Pencil size={11} className="text-text-tertiary hover:text-text-secondary" />
        </button>
        <button
          onClick={() => setConfirming(true)}
          className="p-1 rounded hover:bg-red-100"
          aria-label="Delete decision"
        >
          <Trash2 size={11} className="text-text-tertiary hover:text-red-500" />
        </button>
      </div>
    </div>
  );
}
