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

interface MemoryFactRowProps {
  memory: MemoryRecord;
  onSave: (id: string, updates: { value: string; category: MemoryCategory }) => void;
  onDelete: (id: string) => void;
}

export function MemoryFactRow({ memory, onSave, onDelete }: MemoryFactRowProps) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [value, setValue] = useState(memory.value);
  const [category, setCategory] = useState(memory.category);

  function handleSave() {
    if (!value.trim()) return;
    onSave(memory.id, { value: value.trim(), category });
    setEditing(false);
  }

  function handleCancel() {
    setValue(memory.value);
    setCategory(memory.category);
    setEditing(false);
  }

  if (confirming) {
    return (
      <div className="flex items-center justify-between rounded-lg px-3 py-2 bg-red-50">
        <span className="text-xs text-red-700 truncate">Delete this memory?</span>
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
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Value"
            className="flex-1 rounded-md border border-border bg-surface px-2 py-1 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
            autoFocus
          />
        </div>
        <div className="flex items-center gap-1.5">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as MemoryCategory)}
            className="flex-1 rounded-md border border-border bg-surface px-2 py-1 text-xs text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
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
    <div className="group flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-page-bg transition-colors">
      <span
        className={`inline-block shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium leading-none ${
          CATEGORY_COLORS[memory.category] || CATEGORY_COLORS.general
        }`}
      >
        {memory.category}
      </span>
      <span className="text-xs text-text-tertiary truncate min-w-0">
        {memory.key.replace(/_/g, " ")}:
      </span>
      <span className="text-xs text-text-primary truncate flex-1">
        {memory.value}
      </span>
      <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setEditing(true)}
          className="p-1 rounded hover:bg-surface-hover"
          aria-label="Edit memory"
        >
          <Pencil size={11} className="text-text-tertiary hover:text-text-secondary" />
        </button>
        <button
          onClick={() => setConfirming(true)}
          className="p-1 rounded hover:bg-red-100"
          aria-label="Delete memory"
        >
          <Trash2 size={11} className="text-text-tertiary hover:text-red-500" />
        </button>
      </div>
    </div>
  );
}
