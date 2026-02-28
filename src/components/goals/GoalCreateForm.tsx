"use client";

import { useState, useRef } from "react";
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

  // Auto-suggest state
  const [categorySuggested, setCategorySuggested] = useState(false);
  const [categoryManuallySet, setCategoryManuallySet] = useState(false);
  const [suggestingCategory, setSuggestingCategory] = useState(false);
  const [validationAttempted, setValidationAttempted] = useState(false);

  // Abort controller for suggest-category calls
  const suggestAbortRef = useRef<AbortController | null>(null);

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
        // Auto-fill category if API suggested one and user hasn't manually picked
        if (data.suggestedCategory && !categoryManuallySet) {
          setCategory(data.suggestedCategory);
          setCategorySuggested(true);
        }
      } else {
        setGenerateError(true);
      }
    } catch {
      setGenerateError(true);
    } finally {
      setGenerating(false);
    }
  }

  async function handleDescriptionBlur() {
    if (!title.trim() || !description.trim() || categoryManuallySet || category) return;

    // Cancel any in-flight suggest call
    suggestAbortRef.current?.abort();
    const controller = new AbortController();
    suggestAbortRef.current = controller;

    setSuggestingCategory(true);
    try {
      const resp = await fetch("/api/suggest-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim() }),
        signal: controller.signal,
      });
      if (resp.ok) {
        const data = await resp.json();
        // Only auto-fill if user still hasn't manually picked
        if (data.category && !categoryManuallySet) {
          setCategory(data.category);
          setCategorySuggested(true);
        }
      }
    } catch {
      // Silently ignore — category suggestion is best-effort
    } finally {
      setSuggestingCategory(false);
    }
  }

  function handleCategoryChange(value: string) {
    setCategory(value);
    if (value) {
      setCategoryManuallySet(true);
      setCategorySuggested(false);
    } else {
      setCategoryManuallySet(false);
    }
  }

  const isFormValid = title.trim() && description.trim() && category;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationAttempted(true);
    if (!isFormValid || submitting) return;
    setSubmitting(true);
    try {
      const id = nanoid(10);
      const trimmedTitle = title.trim();
      const goalDescription = description.trim();
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
      const kickoff = goalDescription;
      router.push(`/chat/${id}?message=${encodeURIComponent(kickoff)}`);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  const showDescriptionError = validationAttempted && !description.trim();
  const showCategoryError = validationAttempted && !category;

  return (
    <form onSubmit={handleSubmit} className="mx-2 rounded-lg bg-surface border border-border p-3 flex flex-col gap-2">
      <div className="flex gap-1.5">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={resolvePromptYears("e.g., Prepare for Tax Season {thisYear}")}
          className="flex-1 rounded-md bg-page-bg border border-border px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
          autoFocus
        />
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!title.trim() || generating || submitting}
          className="flex items-center gap-1 rounded-md bg-accent/10 px-2.5 py-1.5 text-xs text-accent hover:bg-accent/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {generating ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Sparkles size={12} />
          )}
          Generate
        </button>
      </div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={handleDescriptionBlur}
        placeholder="Describe your goal in detail (required — or click Generate)"
        rows={3}
        className={`w-full rounded-md bg-page-bg border px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent resize-none ${
          showDescriptionError ? "border-red-400" : "border-border"
        }`}
      />
      {generateError && (
        <p className="text-xs text-red-500 -mt-1">Generation failed — try again or write your own</p>
      )}
      {showDescriptionError && (
        <p className="text-xs text-red-500 -mt-1">Description is required — type one or click Generate</p>
      )}
      <div className="relative">
        <select
          value={category}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className={`w-full rounded-md bg-page-bg border px-2.5 py-1.5 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-accent ${
            showCategoryError ? "border-red-400" : "border-border"
          } ${category ? "text-text-secondary" : "text-text-tertiary"}`}
        >
          <option value="">Select a category</option>
          {promptCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
        </select>
        {suggestingCategory && (
          <Loader2 size={14} className="absolute right-7 top-1/2 -translate-y-1/2 animate-spin text-accent" />
        )}
        {categorySuggested && !suggestingCategory && (
          <Sparkles size={14} className="absolute right-7 top-1/2 -translate-y-1/2 text-accent" />
        )}
      </div>
      {showCategoryError && (
        <p className="text-xs text-red-500 -mt-1">Please select a category</p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!isFormValid || submitting}
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
