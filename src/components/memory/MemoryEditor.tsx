"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Plus } from "lucide-react";
import { nanoid } from "nanoid";
import { useApp } from "@/context/AppContext";
import {
  listMemoriesByType,
  saveMemory,
  getMemory,
  deleteMemory,
} from "@/hooks/useMemoryStore";
import { MemoryFactRow } from "./MemoryFactRow";
import { MemoryDecisionRow } from "./MemoryDecisionRow";
import type { MemoryRecord, MemoryCategory } from "@/types";

interface MemoryEditorProps {
  onClose: () => void;
}

type Tab = "facts" | "decisions";

export function MemoryEditor({ onClose }: MemoryEditorProps) {
  const { memoryListVersion, refreshMemoryList } = useApp();
  const [tab, setTab] = useState<Tab>("facts");
  const [facts, setFacts] = useState<MemoryRecord[]>([]);
  const [decisions, setDecisions] = useState<MemoryRecord[]>([]);

  const loadMemories = useCallback(async () => {
    const [f, d] = await Promise.all([
      listMemoriesByType("fact"),
      listMemoriesByType("decision"),
    ]);
    setFacts(f);
    setDecisions(d);
  }, []);

  useEffect(() => {
    loadMemories();
  }, [loadMemories, memoryListVersion]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function handleSaveFact(
    id: string,
    updates: { value: string; category: MemoryCategory },
  ) {
    const mem = await getMemory(id);
    if (!mem) return;
    mem.value = updates.value;
    mem.category = updates.category;
    mem.updatedAt = Date.now();
    await saveMemory(mem);
    refreshMemoryList();
  }

  async function handleSaveDecision(
    id: string,
    updates: { value: string; context?: string; category: MemoryCategory },
  ) {
    const mem = await getMemory(id);
    if (!mem) return;
    mem.value = updates.value;
    mem.context = updates.context;
    mem.category = updates.category;
    mem.updatedAt = Date.now();
    await saveMemory(mem);
    refreshMemoryList();
  }

  async function handleDelete(id: string) {
    await deleteMemory(id);
    refreshMemoryList();
  }

  async function handleAddFact() {
    const now = Date.now();
    await saveMemory({
      id: nanoid(10),
      type: "fact",
      key: `custom_${nanoid(4)}`,
      value: "",
      category: "general",
      confidence: 1.0,
      source: { chatId: "", messageId: "", extractedAt: now },
      createdAt: now,
      updatedAt: now,
    });
    refreshMemoryList();
  }

  async function handleAddDecision() {
    const now = Date.now();
    await saveMemory({
      id: nanoid(10),
      type: "decision",
      key: `decision_${nanoid(4)}`,
      value: "",
      category: "general",
      confidence: 1.0,
      source: { chatId: "", messageId: "", extractedAt: now },
      keywords: [],
      createdAt: now,
      updatedAt: now,
    });
    refreshMemoryList();
  }

  const items = tab === "facts" ? facts : decisions;

  // Group facts by category for display
  const groupedFacts = new Map<string, MemoryRecord[]>();
  if (tab === "facts") {
    for (const f of facts) {
      const list = groupedFacts.get(f.category) || [];
      list.push(f);
      groupedFacts.set(f.category, list);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative w-full max-w-2xl max-h-[80vh] bg-surface rounded-xl shadow-xl border border-border flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h2 className="text-base font-semibold text-text-primary">Memory</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors"
            aria-label="Close"
          >
            <X size={16} className="text-text-tertiary" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 px-5 pt-3 shrink-0">
          <button
            onClick={() => setTab("facts")}
            className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors ${
              tab === "facts"
                ? "bg-page-bg text-text-primary"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            Profile Facts ({facts.length})
          </button>
          <button
            onClick={() => setTab("decisions")}
            className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors ${
              tab === "decisions"
                ? "bg-page-bg text-text-primary"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            Key Decisions ({decisions.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-3 min-h-0">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-text-tertiary">
              <p className="text-sm">
                {tab === "facts"
                  ? "No profile facts yet. They'll be extracted automatically from your conversations."
                  : "No key decisions yet. They'll be extracted when you discuss financial choices."}
              </p>
            </div>
          ) : tab === "facts" ? (
            <div className="flex flex-col gap-1">
              {Array.from(groupedFacts.entries()).map(([cat, items]) => (
                <div key={cat}>
                  <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider px-3 py-1 block">
                    {cat}
                  </span>
                  {items.map((mem) => (
                    <MemoryFactRow
                      key={mem.id}
                      memory={mem}
                      onSave={handleSaveFact}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {decisions.map((mem) => (
                <MemoryDecisionRow
                  key={mem.id}
                  memory={mem}
                  onSave={handleSaveDecision}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {/* Add button */}
          <button
            onClick={tab === "facts" ? handleAddFact : handleAddDecision}
            className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-border py-2 text-xs text-text-tertiary hover:text-text-secondary hover:border-border-hover transition-colors"
          >
            <Plus size={12} />
            Add {tab === "facts" ? "fact" : "decision"}
          </button>
        </div>
      </div>
    </div>
  );
}
