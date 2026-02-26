"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { useApp } from "@/context/AppContext";
import { createGoal, scanExistingChatsForSignals } from "@/hooks/useGoalStore";
import { promptCategories } from "@/lib/prompts";

interface GoalCreateFormProps {
  onClose: () => void;
}

export function GoalCreateForm({ onClose }: GoalCreateFormProps) {
  const router = useRouter();
  const { selectedModel, setActiveChatId, refreshGoalList, refreshChatList } =
    useApp();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const id = nanoid(10);
    const trimmedTitle = title.trim();
    await createGoal(id, selectedModel, trimmedTitle, category || undefined);
    setActiveChatId(id);
    refreshGoalList();
    refreshChatList();
    // Fire-and-forget: scan existing chats for signals relevant to this new goal
    scanExistingChatsForSignals(id, trimmedTitle, trimmedTitle, category || undefined).then(() => refreshGoalList());
    onClose();
    const kickoff = `Help me work on my goal: ${title.trim()}. What information do you need to get started, and what are the first steps?`;
    router.push(`/chat/${id}?message=${encodeURIComponent(kickoff)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="mx-2 rounded-lg bg-surface border border-border p-3 flex flex-col gap-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g., Prepare for Tax Season 2026"
        className="w-full rounded-md bg-page-bg border border-border px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
        autoFocus
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full rounded-md bg-page-bg border border-border px-2.5 py-1.5 text-sm text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent"
      >
        <option value="">Category (optional)</option>
        {promptCategories
          .filter((c) => c.id !== "neocash" && c.id !== "goals")
          .map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
      </select>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!title.trim()}
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
