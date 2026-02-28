"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { Sparkles, Loader2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { createGoal, setDashboardSchema, scanExistingChatsForSignals } from "@/hooks/useGoalStore";
import { promptCategories, resolvePromptYears } from "@/lib/prompts";

interface GoalCreateFormProps {
  onClose: () => void;
}

export function GoalCreateForm({ onClose }: GoalCreateFormProps) {
  const router = useRouter();
  const { selectedModel, setActiveChatId, refreshGoalList, refreshChatList } =
    useApp();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generateError, setGenerateError] = useState(false);

  async function handleGenerate() {
    if (!title.trim()) return;
    setGenerating(true);
    setGenerateError(false);
    try {
      const resp = await fetch("/api/generate-goal-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), category: category || undefined }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setDescription(data.prompt);
      } else {
        setGenerateError(true);
      }
    } catch {
      setGenerateError(true);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    try {
      const id = nanoid(10);
      const trimmedTitle = title.trim();
      const goalDescription = description.trim() || trimmedTitle;
      await createGoal(id, selectedModel, trimmedTitle, category || undefined, goalDescription, "custom");
      setActiveChatId(id);
      refreshGoalList();
      refreshChatList();
      // Fire-and-forget: generate schema first, then scan with schema available
      fetch("/api/generate-dashboard-schema", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmedTitle, description: goalDescription, category: category || undefined }),
      })
        .then((r) => r.json())
        .then(async (data) => {
          const schema = data.schema?.length > 0 ? data.schema : undefined;
          if (schema) await setDashboardSchema(id, schema);
          refreshGoalList();
          // Now scan existing chats with the schema available
          return scanExistingChatsForSignals(id, trimmedTitle, goalDescription, category || undefined, schema);
        })
        .then(() => refreshGoalList())
        .catch(() => {/* best-effort */});
      // Use the description as kickoff message if available, otherwise generic
      const kickoff = goalDescription !== trimmedTitle
        ? goalDescription
        : `Help me work on my goal: ${trimmedTitle}. What information do you need to get started, and what are the first steps?`;
      router.push(`/chat/${id}?message=${encodeURIComponent(kickoff)}`);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-2 rounded-lg bg-surface border border-border p-3 flex flex-col gap-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={resolvePromptYears("e.g., Prepare for Tax Season {thisYear}")}
        className="w-full rounded-md bg-page-bg border border-border px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
        autoFocus
      />
      <div className="relative">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detailed prompt (optional — or generate one)"
          rows={3}
          className="w-full rounded-md bg-page-bg border border-border px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent resize-none"
        />
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!title.trim() || generating || submitting}
          className="absolute right-1.5 bottom-1.5 flex items-center gap-1 rounded-md bg-accent/10 px-2 py-1 text-xs text-accent hover:bg-accent/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {generating ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Sparkles size={12} />
          )}
          Generate
        </button>
      </div>
      {generateError && (
        <p className="text-xs text-red-500 -mt-1">Generation failed — try again or write your own</p>
      )}
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full rounded-md bg-page-bg border border-border px-2.5 py-1.5 text-sm text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent"
      >
        <option value="">Category (optional)</option>
        {promptCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
      </select>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!title.trim() || submitting}
          className="flex-1 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-3 py-1.5 text-sm text-text-secondary hover:bg-sidebar-hover transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
