# Improve Goals Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Polish Goal Threads UX, improve signal detection quality via enriched descriptions, and add discoverability features.

**Architecture:** 9 changes across 3 categories (UX fixes, signal quality, discoverability). Most changes are isolated to single files. The signal quality improvement (Tasks 6-7) is the highest-impact change: enriching `GoalMeta.description` from a title copy into a Haiku-generated structured prompt, then feeding it into the detect-signals API. A new `/api/generate-goal-prompt` endpoint handles AI generation.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, Vercel AI SDK v4, IndexedDB via idb-keyval, Lucide React icons.

**Intent:** `intents/improve-goals.md`

---

## Task 1: Click-outside-to-dismiss Goals dropdown

**Files:**
- Modify: `src/components/chat/PromptCategories.tsx`

**Context:** The Goals (and all category) dropdown stays open when clicking outside. The context dropdown in ChatInput already uses a click-outside pattern. We need to add a `useEffect` with `mousedown` listener that checks if the click target is outside the component.

**Step 1: Add ref and click-outside handler**

In `src/components/chat/PromptCategories.tsx`, add a `useRef` for the container div and a `useEffect` that listens for mousedown events outside:

```tsx
import { useState, useRef, useEffect } from "react";

// Inside the component, before the return:
const containerRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (!activeCategory) return;
  function handleMouseDown(e: MouseEvent) {
    if (
      containerRef.current &&
      !containerRef.current.contains(e.target as Node)
    ) {
      setActiveCategory(null);
    }
  }
  document.addEventListener("mousedown", handleMouseDown);
  return () => document.removeEventListener("mousedown", handleMouseDown);
}, [activeCategory]);
```

Attach `ref={containerRef}` to the outermost `<div>` in the return.

**Step 2: Verify manually**

Open the app → new chat → click a category tab → click outside → dropdown should close.

**Step 3: Commit**

```bash
git add src/components/chat/PromptCategories.tsx
git commit -m "feat: add click-outside-to-dismiss for category dropdowns"
```

---

## Task 2: Show existing goals in Goals dropdown

**Files:**
- Modify: `src/components/chat/PromptCategories.tsx`
- Modify: `src/components/chat/PromptSuggestions.tsx`

**Context:** When the Goals tab is active, the dropdown currently only shows 5 predefined goal prompts. It should also show the user's existing goals (from IndexedDB) above the predefined prompts, with a Target icon, signal count pill, and click-to-navigate behavior.

**Step 1: Fetch goals and pass to PromptSuggestions**

In `PromptCategories.tsx`:
- Import `useEffect, useState` (already there), add `useApp` from context and `listGoals` from useGoalStore
- Add state: `const [existingGoals, setExistingGoals] = useState<ChatRecord[]>([])`
- Add effect to fetch goals when the goals tab is active:
```tsx
import { useApp } from "@/context/AppContext";
import { listGoals } from "@/hooks/useGoalStore";
import type { ChatRecord } from "@/types";

// Inside component:
const { goalListVersion } = useApp();
const [existingGoals, setExistingGoals] = useState<ChatRecord[]>([]);

useEffect(() => {
  if (activeCategory === "goals") {
    listGoals().then(setExistingGoals);
  }
}, [activeCategory, goalListVersion]);
```

Pass `existingGoals` to `PromptSuggestions` when rendering the goals category:
```tsx
<PromptSuggestions
  prompts={activeData.prompts}
  existingGoals={activeData.id === "goals" ? existingGoals : undefined}
  onSelect={(prompt) => { /* existing handler */ }}
  onGoalNavigate={(goalId) => {
    setActiveCategory(null);
    router.push(`/chat/${goalId}`);
  }}
/>
```

Add `useRouter` import and `const router = useRouter()` to the component.

**Step 2: Render existing goals in PromptSuggestions**

In `PromptSuggestions.tsx`, add the new props and render existing goals above predefined prompts:

```tsx
import { Target, Zap } from "lucide-react";
import type { ChatRecord, Prompt } from "@/types";

interface PromptSuggestionsProps {
  prompts: Prompt[];
  onSelect: (prompt: Prompt) => void;
  existingGoals?: ChatRecord[];
  onGoalNavigate?: (goalId: string) => void;
  hoveredPrompt?: Prompt | null;
  onHoverPrompt?: (prompt: Prompt | null) => void;
}

export function PromptSuggestions({
  prompts,
  onSelect,
  existingGoals,
  onGoalNavigate,
}: PromptSuggestionsProps) {
  return (
    <div
      className="w-full rounded-xl bg-surface p-1.5"
      style={{ boxShadow: "var(--shadow-dropdown)" }}
    >
      {/* Existing goals section */}
      {existingGoals && existingGoals.length > 0 && (
        <>
          {existingGoals.map((goal) => (
            <button
              key={goal.id}
              onClick={() => onGoalNavigate?.(goal.id)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-text-secondary transition-colors hover:bg-surface-hover"
            >
              <Target size={14} className="shrink-0 text-accent" />
              <span className="truncate flex-1">{goal.title}</span>
              {goal.goal && goal.goal.signalCount > 0 && (
                <span className="flex items-center gap-0.5 text-xs text-text-tertiary">
                  <Zap size={10} className="text-accent" />
                  {goal.goal.signalCount}
                </span>
              )}
            </button>
          ))}
          {/* Divider between existing goals and predefined prompts */}
          <div className="mx-2 my-1 border-t border-border" />
        </>
      )}

      {/* Predefined prompts */}
      {prompts.map((prompt) => (
        <button
          key={prompt.title}
          onClick={() => onSelect(prompt)}
          className="flex w-full rounded-lg px-3 py-2.5 text-left text-sm text-text-secondary transition-colors hover:bg-surface-hover"
        >
          {prompt.title}
        </button>
      ))}
    </div>
  );
}
```

**Step 3: Verify manually**

1. Create a goal via sidebar → verify it appears in Goals dropdown on new chat
2. Click the existing goal → should navigate to the goal thread (not create a duplicate)
3. Signal count should show next to goals that have signals

**Step 4: Commit**

```bash
git add src/components/chat/PromptCategories.tsx src/components/chat/PromptSuggestions.tsx
git commit -m "feat: show existing goals in Goals dropdown with signal counts"
```

---

## Task 3: Move "+" to Goals tab, remove from sidebar

**Files:**
- Modify: `src/components/chat/PromptCategories.tsx`
- Modify: `src/components/layout/GoalList.tsx`
- Modify: `src/components/goals/GoalCreateForm.tsx` (minor: make it work in new-chat context)
- Modify: `src/app/chat/new/page.tsx`

**Context:** The "+" icon currently lives in the sidebar GoalList header. Move it next to the "Goals" tab button in PromptCategories. When clicked, it should open the GoalCreateForm inline (similar to how the sidebar does it). The sidebar "+" should be removed.

**Step 1: Add "+" button next to Goals tab in PromptCategories**

In `PromptCategories.tsx`, add state for `showGoalForm` and render a Plus icon next to the Goals tab:

```tsx
import { GoalCreateForm } from "@/components/goals/GoalCreateForm";
import { Plus } from "lucide-react";

// Inside component:
const [showGoalForm, setShowGoalForm] = useState(false);
```

In the category tabs map, for the goals tab specifically, render a "+" button right after it:

```tsx
{promptCategories.map((category) => {
  const Icon = iconMap[category.icon as keyof typeof iconMap];
  const isActive = activeCategory === category.id;
  const isGoal = category.id === "goals";

  return (
    <div key={category.id} className="flex items-center">
      <button
        onClick={() =>
          setActiveCategory(isActive ? null : category.id)
        }
        className={`category-tab flex items-center gap-1.5 rounded-lg px-3 h-8 text-sm ${
          isActive
            ? "bg-surface text-text-primary shadow-[0_0_0_0.5px_rgba(31,30,29,0.25)]"
            : isGoal
              ? "text-accent hover:bg-surface-hover shadow-[0_0_0_0.5px_rgba(196,112,75,0.3)]"
              : "text-text-secondary hover:bg-surface-hover shadow-[0_0_0_0.5px_rgba(31,30,29,0.12)]"
        }`}
      >
        {Icon && <Icon size={14} />}
        <span>{category.label}</span>
      </button>
      {isGoal && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowGoalForm(!showGoalForm);
            setActiveCategory(null);
          }}
          className="ml-0.5 flex h-8 w-6 items-center justify-center rounded-lg text-accent hover:bg-surface-hover transition-colors"
          aria-label="New goal"
        >
          <Plus size={14} />
        </button>
      )}
    </div>
  );
})}
```

Below the category tabs but above the dropdown, conditionally render the GoalCreateForm:

```tsx
{showGoalForm && (
  <div className="w-full max-w-lg">
    <GoalCreateForm onClose={() => setShowGoalForm(false)} />
  </div>
)}
```

**Step 2: Remove "+" from sidebar GoalList**

In `src/components/layout/GoalList.tsx`, remove the Plus icon import (keep it if used elsewhere — check), remove the `showForm` state, remove the `<button>` with `aria-label="New goal"`, and remove the `{showForm && <GoalCreateForm .../>}` block.

The section header becomes:

```tsx
<div className="flex items-center px-3 pb-1">
  <button
    onClick={() => setCollapsed(!collapsed)}
    className="flex flex-1 items-center gap-1 text-xs font-medium text-text-tertiary uppercase tracking-wider hover:text-text-secondary transition-colors"
  >
    {collapsed ? (
      <ChevronRight size={12} />
    ) : (
      <ChevronDown size={12} />
    )}
    <span>Goals</span>
    {goals.length > 0 && (
      <span className="ml-auto text-[10px] font-normal tabular-nums">
        {goals.length}
      </span>
    )}
  </button>
</div>
```

Remove the `Plus` and `GoalCreateForm` imports if no longer used. Remove `showForm` state.

**Step 3: Show GoalList in sidebar even when empty**

Since users can no longer create goals from the sidebar, the GoalList should still be visible (as a section header) so users can see the "Goals" label. But currently line 42 of GoalList.tsx returns null if `goals.length === 0 && !showForm`. Change this to:

```tsx
if (goals.length === 0) return null;
```

This keeps the sidebar clean — no goals section until first goal is created (which now happens from the new chat screen).

**Step 4: Verify manually**

1. New chat screen → "+" next to Goals tab → form appears → create goal → navigates to goal thread
2. Sidebar → Goals section should NOT have "+" button
3. Sidebar → Goals section shows goals if any exist, hidden if none

**Step 5: Commit**

```bash
git add src/components/chat/PromptCategories.tsx src/components/layout/GoalList.tsx
git commit -m "feat: move goal creation '+' to Goals tab on new chat screen"
```

---

## Task 4: Rename "Cross-pollinate" → "Capture signals"

**Files:**
- Modify: `src/components/goals/GoalSignalPanel.tsx`

**Context:** Simple label change on line 61 of GoalSignalPanel.tsx.

**Step 1: Change the label text**

In `GoalSignalPanel.tsx`, change the `<span>` text from `Cross-pollinate` to `Capture signals`:

```tsx
<span className="text-xs text-text-secondary">
  Capture signals
</span>
```

**Step 2: Verify manually**

Open a goal thread → signal panel should show "Capture signals" instead of "Cross-pollinate".

**Step 3: Commit**

```bash
git add src/components/goals/GoalSignalPanel.tsx
git commit -m "feat: rename 'Cross-pollinate' to 'Capture signals' in goal panel"
```

---

## Task 5: Disable signal capture when paused/completed

**Files:**
- Modify: `src/components/goals/GoalSignalPanel.tsx`
- Modify: `src/app/chat/[chatId]/page.tsx`

**Context:** Two changes needed:
1. **UI:** Gray out the "Capture signals" toggle when status is paused/completed
2. **Logic:** Skip signal detection in the `onFinish` callback when goal status is not active

**Step 1: Gray out toggle in GoalSignalPanel**

In `GoalSignalPanel.tsx`, add a disabled check based on status:

```tsx
{/* Cross-pollination toggle */}
{(() => {
  const isDisabled = goal.status !== "active";
  return (
    <label className={`flex items-center gap-1.5 ${isDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}>
      <Radio
        size={12}
        className={goal.crossPollinate && !isDisabled ? "text-accent" : "text-text-tertiary"}
      />
      <span className="text-xs text-text-secondary">
        Capture signals
      </span>
      <button
        onClick={isDisabled ? undefined : onTogglePollinate}
        disabled={isDisabled}
        className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
          goal.crossPollinate && !isDisabled ? "bg-accent" : "bg-border"
        } ${isDisabled ? "cursor-not-allowed" : ""}`}
      >
        <span
          className={`inline-block h-3 w-3 rounded-full bg-white transition-transform ${
            goal.crossPollinate && !isDisabled ? "translate-x-3.5" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
})()}
```

**Step 2: Filter out non-active goals from cross-pollination in chat page**

In `src/app/chat/[chatId]/page.tsx`, the cross-pollination filter on line 110-113 already checks `g.goal?.status === "active"`. Verify this is correct — it is. No change needed for the runtime logic.

However, when a user changes goal status to paused/completed in the signal panel, the toggle should also auto-turn-off. Update the `handleStatusChange` callback:

```tsx
const handleStatusChange = useCallback(
  async (newStatus: GoalStatus) => {
    await updateGoalStatus(chatId, newStatus);
    setGoalMeta((prev) => {
      if (!prev) return null;
      // Auto-disable capture when pausing/completing
      const crossPollinate = newStatus === "active" ? prev.crossPollinate : false;
      return { ...prev, status: newStatus, crossPollinate };
    });
    // If pausing/completing, persist the crossPollinate=false
    if (newStatus !== "active") {
      await toggleCrossPollination(chatId);
      // Only toggle if it was on (to turn it off)
      const chat = await getChat(chatId);
      if (chat?.goal?.crossPollinate) {
        await toggleCrossPollination(chatId);
      }
    }
    refreshGoalList();
  },
  [chatId, refreshGoalList],
);
```

Actually, that's getting complex. Simpler approach — add a `setCrossPollination` function in useGoalStore:

In `src/hooks/useGoalStore.ts`, add:

```tsx
export async function setCrossPollination(id: string, value: boolean): Promise<void> {
  const chat = await getChat(id);
  if (chat?.goal) {
    chat.goal.crossPollinate = value;
    await set(chatKey(id), { ...chat, updatedAt: Date.now() });
  }
}
```

Then in the chat page's `handleStatusChange`:

```tsx
const handleStatusChange = useCallback(
  async (newStatus: GoalStatus) => {
    await updateGoalStatus(chatId, newStatus);
    // Auto-disable signal capture when pausing/completing
    if (newStatus !== "active") {
      await setCrossPollination(chatId, false);
    }
    setGoalMeta((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        status: newStatus,
        crossPollinate: newStatus === "active" ? prev.crossPollinate : false,
      };
    });
    refreshGoalList();
  },
  [chatId, refreshGoalList],
);
```

Import `setCrossPollination` from `@/hooks/useGoalStore`.

**Step 3: Verify manually**

1. Open an active goal → toggle should be clickable
2. Change status to "Paused" → toggle should gray out, capture should turn off
3. Change status to "Completed" → same behavior
4. Change back to "Active" → toggle should become clickable again (starts off, user can re-enable)

**Step 4: Commit**

```bash
git add src/components/goals/GoalSignalPanel.tsx src/app/chat/[chatId]/page.tsx src/hooks/useGoalStore.ts
git commit -m "feat: disable signal capture toggle when goal is paused or completed"
```

---

## Task 6: Enrich goal description field with AI generation

**Files:**
- Create: `src/app/api/generate-goal-prompt/route.ts`
- Modify: `src/components/goals/GoalCreateForm.tsx`
- Modify: `src/hooks/useGoalStore.ts`
- Modify: `src/app/chat/new/page.tsx`

**Context:** The biggest change. The GoalCreateForm gets a "detailed prompt" textarea and a "Generate" button. The generate button calls a new API endpoint that uses Haiku to create a structured prompt from the title. The description is saved to `GoalMeta.description` and used as the first chat message.

**Step 1: Create the generate-goal-prompt API**

Create `src/app/api/generate-goal-prompt/route.ts`:

```tsx
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

export async function POST(req: Request) {
  try {
    const { title, category } = await req.json();

    if (!title) {
      return Response.json({ error: "Title is required" }, { status: 400 });
    }

    const { text } = await generateText({
      model: anthropic("claude-haiku-4-5-20251001"),
      system: `You generate structured, detailed prompts for personal wealth management goals. Given a short goal title, create a rich prompt (2-4 sentences) that:
1. States the goal clearly in first person ("I want to...")
2. Asks for specific, actionable help
3. Mentions concrete areas to explore
4. Matches the style of these examples:

Title: "Start a tax preparation goal for 2026"
Prompt: "I want to set a goal to prepare for the 2026 tax season. Help me build a month-by-month checklist of what to gather, deadlines to track, and strategies to maximize my refund or minimize what I owe."

Title: "Build an emergency fund plan"
Prompt: "I want to set a goal to build my emergency fund. Help me determine the right target amount based on my expenses, create a savings plan with monthly milestones, and suggest the best accounts to hold it in."

Return ONLY the prompt text, no quotes or explanation.`,
      prompt: `Title: "${title}"${category ? `\nCategory: ${category}` : ""}`,
    });

    return Response.json({ prompt: text.trim() });
  } catch (error) {
    console.error("Goal prompt generation error:", error);
    return Response.json(
      { error: "Failed to generate prompt" },
      { status: 500 },
    );
  }
}
```

**Step 2: Update createGoal to accept description**

In `src/hooks/useGoalStore.ts`, update the `createGoal` function signature to accept an optional `description` parameter:

```tsx
export async function createGoal(
  id: string,
  model: string,
  title: string,
  category?: string,
  description?: string,
): Promise<ChatRecord> {
  const chat = await createChat(id, model);
  chat.title = title;
  chat.goal = {
    type: "goal",
    description: description || title,
    status: "active",
    category,
    signalCount: 0,
    crossPollinate: true,
  };
  await set(chatKey(id), chat);
  return chat;
}
```

**Step 3: Update GoalCreateForm with description textarea and generate button**

Rewrite `src/components/goals/GoalCreateForm.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { Sparkles, Loader2 } from "lucide-react";
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
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    if (!title.trim()) return;
    setGenerating(true);
    try {
      const resp = await fetch("/api/generate-goal-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), category: category || undefined }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setDescription(data.prompt);
      }
    } catch {
      // Best-effort generation
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const id = nanoid(10);
    const trimmedTitle = title.trim();
    const goalDescription = description.trim() || trimmedTitle;
    await createGoal(id, selectedModel, trimmedTitle, category || undefined, goalDescription);
    setActiveChatId(id);
    refreshGoalList();
    refreshChatList();
    // Fire-and-forget: scan existing chats for signals relevant to this new goal
    scanExistingChatsForSignals(id, trimmedTitle, goalDescription, category || undefined).then(() => refreshGoalList());
    onClose();
    // Use the description as kickoff message if available, otherwise generic
    const kickoff = goalDescription !== trimmedTitle
      ? goalDescription
      : `Help me work on my goal: ${trimmedTitle}. What information do you need to get started, and what are the first steps?`;
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
          disabled={!title.trim() || generating}
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
```

**Step 4: Update new chat page to pass description through for predefined goals**

In `src/app/chat/new/page.tsx`, the `startChat` function creates goals from predefined prompts. These already have rich `prompt.text` — it should be saved as the description. Update the goal creation path:

```tsx
if (categoryId === "goals") {
  const title = goalTitle || message.slice(0, 60);
  await createGoal(id, selectedModel, title, undefined, message);
  setActiveChatId(id);
  refreshGoalList();
  refreshChatList();
  scanExistingChatsForSignals(id, title, message).then(() => refreshGoalList());
  router.push(`/chat/${id}?message=${encodeURIComponent(message)}`);
  return;
}
```

The key change is passing `message` (the full prompt text) as the `description` parameter to `createGoal`.

**Step 5: Verify manually**

1. New chat → "+" next to Goals → type title → click "Generate" → should fill textarea with Haiku-generated prompt
2. Edit the prompt → click "Create" → goal thread opens with the prompt as kickoff message
3. Create a goal without generating a prompt → should use generic kickoff
4. Click a predefined goal prompt → description should be the rich prompt text (not the title)

**Step 6: Commit**

```bash
git add src/app/api/generate-goal-prompt/route.ts src/components/goals/GoalCreateForm.tsx src/hooks/useGoalStore.ts src/app/chat/new/page.tsx
git commit -m "feat: add AI-generated goal descriptions with Haiku prompt generation"
```

---

## Task 7: Fix detect-signals API to use description

**Files:**
- Modify: `src/app/api/detect-signals/route.ts`

**Context:** Currently line 17 of the detect-signals route builds the goal list string as:
`- ID: ${g.id} | Title: ${g.title} | Category: ${g.category || "general"}`

It receives `g.description` in the request body but doesn't include it. This is the single highest-impact change for signal quality.

**Step 1: Include description in the goal list**

In `src/app/api/detect-signals/route.ts`, update the `goalList` mapping:

```tsx
const goalList = goals
  .map(
    (g: { id: string; title: string; description: string; category: string }) =>
      `- ID: ${g.id} | Title: ${g.title} | Category: ${g.category || "general"}${
        g.description && g.description !== g.title
          ? ` | Description: ${g.description}`
          : ""
      }`,
  )
  .join("\n");
```

This conditionally includes the description when it's richer than just the title copy, keeping the prompt concise for old goals while giving full context for enriched ones.

**Step 2: Verify manually**

1. Create a goal with a generated description
2. Chat in a regular thread about something related to that goal
3. Check that signals are detected (they should be more accurate now with the richer description)

**Step 3: Commit**

```bash
git add src/app/api/detect-signals/route.ts
git commit -m "feat: include goal description in signal detection prompt for better matching"
```

---

## Task 8: Visual distinction for custom vs predefined goals

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/hooks/useGoalStore.ts`
- Modify: `src/app/chat/new/page.tsx`
- Modify: `src/components/chat/PromptSuggestions.tsx`
- Modify: `src/components/layout/GoalList.tsx`

**Context:** User-created goals (from the "+" form) should have a different icon color from predefined goals (from the Goals prompt tab). We'll add an `origin` field to `GoalMeta`: `"custom"` or `"predefined"`.

**Step 1: Add origin field to GoalMeta**

In `src/types/index.ts`, add to the `GoalMeta` interface:

```tsx
export interface GoalMeta {
  type: "goal";
  description: string;
  status: GoalStatus;
  category?: string;
  signalCount: number;
  crossPollinate: boolean;
  origin?: "custom" | "predefined";  // custom = "+" form, predefined = Goals tab prompt
}
```

Optional field with `?` for backwards compatibility with existing goals (which will be treated as `"predefined"` or show default styling).

**Step 2: Set origin in createGoal**

In `src/hooks/useGoalStore.ts`, update `createGoal` to accept origin:

```tsx
export async function createGoal(
  id: string,
  model: string,
  title: string,
  category?: string,
  description?: string,
  origin?: "custom" | "predefined",
): Promise<ChatRecord> {
  const chat = await createChat(id, model);
  chat.title = title;
  chat.goal = {
    type: "goal",
    description: description || title,
    status: "active",
    category,
    signalCount: 0,
    crossPollinate: true,
    origin: origin || "custom",
  };
  await set(chatKey(id), chat);
  return chat;
}
```

**Step 3: Pass origin from callers**

In `GoalCreateForm.tsx` (the "+" form), the call is already `createGoal(id, selectedModel, trimmedTitle, category, goalDescription)` — add `"custom"` as the last arg:

```tsx
await createGoal(id, selectedModel, trimmedTitle, category || undefined, goalDescription, "custom");
```

In `src/app/chat/new/page.tsx`, the predefined goals path:

```tsx
await createGoal(id, selectedModel, title, undefined, message, "predefined");
```

**Step 4: Color the icons differently**

In `src/components/layout/GoalList.tsx`, differentiate icon color:

```tsx
<Target
  size={14}
  className={`shrink-0 ${
    goal.goal?.status === "completed"
      ? "text-text-tertiary"
      : goal.goal?.origin === "custom"
        ? "text-blue-500"
        : "text-accent"
  }`}
/>
```

Custom goals get blue icons; predefined get the copper accent. Completed goals remain tertiary.

In `src/components/chat/PromptSuggestions.tsx`, apply the same logic for existing goals in the dropdown:

```tsx
<Target
  size={14}
  className={`shrink-0 ${
    goal.goal?.origin === "custom" ? "text-blue-500" : "text-accent"
  }`}
/>
```

**Step 5: Verify manually**

1. Create a custom goal via "+" → sidebar icon should be blue
2. Create a predefined goal from Goals tab → sidebar icon should be copper
3. Both should appear correctly colored in the Goals dropdown

**Step 6: Commit**

```bash
git add src/types/index.ts src/hooks/useGoalStore.ts src/app/chat/new/page.tsx src/components/chat/PromptSuggestions.tsx src/components/layout/GoalList.tsx src/components/goals/GoalCreateForm.tsx
git commit -m "feat: visual distinction between custom and predefined goals with colored icons"
```

---

## Task 9: Hover-to-preview prompt in Goals dropdown

**Files:**
- Modify: `src/components/chat/PromptCategories.tsx`
- Modify: `src/components/chat/PromptSuggestions.tsx`
- Modify: `src/app/chat/new/page.tsx`

**Context:** When hovering a goal in the new chat dropdown (both existing goals and predefined prompts), the prompt text should appear in the input box, grayed out, as a preview. This uses the existing `onPrefill` pattern but with a "preview" mode that shows text in gray and clears on mouse leave.

**Step 1: Add preview state to new chat page**

In `src/app/chat/new/page.tsx`, add a `previewText` state:

```tsx
const [previewText, setPreviewText] = useState("");
```

Pass it to ChatInput as a preview prop, and pass a setter to PromptCategories:

```tsx
<ChatInput
  onSend={(text, files) => startChat(text, files)}
  autoFocus
  value={inputValue}
  onChange={setInputValue}
  previewText={previewText}
/>

<PromptCategories
  onSelectPrompt={(prompt, categoryId, goalTitle) => {
    setPreviewText("");
    if (categoryId === "goals") {
      startChat(prompt, undefined, categoryId, goalTitle);
    } else {
      startChat(prompt);
    }
  }}
  visible={categoriesVisible}
  onPrefill={handlePrefill}
  onPreview={setPreviewText}
/>
```

**Step 2: Add preview support to PromptCategories**

In `PromptCategories.tsx`, add the `onPreview` prop and pass it through:

```tsx
interface PromptCategoriesProps {
  onSelectPrompt: (prompt: string, categoryId?: string, goalTitle?: string) => void;
  visible?: boolean;
  onPrefill?: (text: string) => void;
  onPreview?: (text: string) => void;
}
```

Pass `onPreview` to PromptSuggestions:

```tsx
<PromptSuggestions
  prompts={activeData.prompts}
  existingGoals={activeData.id === "goals" ? existingGoals : undefined}
  onSelect={...}
  onGoalNavigate={...}
  onPreview={activeData.id === "goals" ? onPreview : undefined}
/>
```

Clear preview when dropdown closes:

```tsx
// In the setActiveCategory calls, also clear preview:
setActiveCategory(isActive ? null : category.id);
if (isActive) onPreview?.("");
```

**Step 3: Add hover handlers in PromptSuggestions**

In `PromptSuggestions.tsx`, add `onPreview` prop and mouse handlers:

```tsx
interface PromptSuggestionsProps {
  prompts: Prompt[];
  onSelect: (prompt: Prompt) => void;
  existingGoals?: ChatRecord[];
  onGoalNavigate?: (goalId: string) => void;
  onPreview?: (text: string) => void;
}
```

For predefined prompts, show the prompt text on hover:
```tsx
<button
  key={prompt.title}
  onClick={() => onSelect(prompt)}
  onMouseEnter={() => onPreview?.(prompt.text)}
  onMouseLeave={() => onPreview?.("")}
  className="flex w-full rounded-lg px-3 py-2.5 text-left text-sm text-text-secondary transition-colors hover:bg-surface-hover"
>
  {prompt.title}
</button>
```

For existing goals, show the goal description on hover:
```tsx
<button
  key={goal.id}
  onClick={() => onGoalNavigate?.(goal.id)}
  onMouseEnter={() => onPreview?.(goal.goal?.description || goal.title)}
  onMouseLeave={() => onPreview?.("")}
  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-text-secondary transition-colors hover:bg-surface-hover"
>
  ...
</button>
```

**Step 4: Show preview in ChatInput**

In `src/components/chat/ChatInput.tsx`, add a `previewText` prop to the interface:

```tsx
interface ChatInputProps {
  onSend: (text: string, files?: FileUIPart[]) => void;
  onStop?: () => void;
  isLoading?: boolean;
  autoFocus?: boolean;
  initialValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  previewText?: string;
}
```

Add `previewText` to the destructured props (default `""`). Then on the textarea (currently line 121), dynamically override the placeholder:

```tsx
placeholder={previewText || APP_PLACEHOLDER}
```

The existing `placeholder:text-text-placeholder` class already renders placeholders in gray. When the user hovers a goal prompt, the placeholder dynamically changes to show the prompt text. When they move away, it reverts to the default `APP_PLACEHOLDER` ("How can I help you with your finances?").

**Step 5: Verify manually**

1. New chat → Goals tab → hover over a predefined prompt → prompt text appears as placeholder in input
2. Hover over an existing goal → goal description appears as placeholder
3. Move mouse away → placeholder returns to default
4. Type in input box → preview disappears (categories hide)

**Step 6: Commit**

```bash
git add src/app/chat/new/page.tsx src/components/chat/PromptCategories.tsx src/components/chat/PromptSuggestions.tsx src/components/chat/ChatInput.tsx
git commit -m "feat: hover-to-preview goal prompts in input box placeholder"
```

---

## Summary

| Task | Category | Files | Complexity |
|------|----------|-------|------------|
| 1. Click-outside-to-dismiss | UX Fix | 1 | Low |
| 2. Show existing goals in dropdown | UX Fix | 2 | Medium |
| 3. Move "+" to Goals tab | UX Fix | 3 | Medium |
| 4. Rename to "Capture signals" | UX Fix | 1 | Trivial |
| 5. Disable capture when paused/completed | UX Fix | 3 | Medium |
| 6. Enrich goal description + AI gen | Signal Quality | 4 | High |
| 7. Fix detect-signals to use description | Signal Quality | 1 | Low |
| 8. Visual distinction custom vs predefined | Discoverability | 6 | Medium |
| 9. Hover-to-preview prompt | Discoverability | 4 | Medium |

**Suggested batches:**
- Batch 1: Tasks 1-3 (UX fixes — dropdown behavior)
- Batch 2: Tasks 4-5 (UX fixes — signal panel)
- Batch 3: Tasks 6-7 (Signal quality — the big win)
- Batch 4: Tasks 8-9 (Discoverability polish)
