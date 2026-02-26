# Improve Goals — Bug Fixes & Polish

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 8 bugs and UX issues discovered during code review of the Improve Goals feature release.

**Architecture:** All changes are isolated to existing files — no new files or API endpoints. Fixes span the GoalCreateForm (double-submit, error feedback), PromptCategories (form/dropdown co-existence, click-outside), GoalSignalPanel (invalid HTML), useGoalStore (dead code, scan batching), and GoalList (completed goal distinction). Each fix is independent and can be committed separately.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Lucide React icons, IndexedDB via idb-keyval.

**Intent:** `intents/improve-goals.md` (parent feature)

---

## Task 1: Double-submit guard on GoalCreateForm

**Files:**
- Modify: `src/components/goals/GoalCreateForm.tsx:22,44-63,114`

**Context:** `handleSubmit` is async but the "Create" button is only disabled when `!title.trim()`. A user can click "Create" twice before `createGoal` resolves, producing duplicate goals.

**Step 1: Add `submitting` state and wire it into handleSubmit**

In `GoalCreateForm.tsx`, add a `submitting` state alongside `generating` (line 22), set it true at the start of `handleSubmit`, and disable both buttons while submitting:

```tsx
// Line 22 — add after generating state:
const [submitting, setSubmitting] = useState(false);

// Line 44 — handleSubmit:
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!title.trim() || submitting) return;
  setSubmitting(true);
  // ... rest of function unchanged (no finally needed — component unmounts on navigation)
```

```tsx
// Line 114 — Create button:
disabled={!title.trim() || submitting}

// Line 86 — Generate button (also disable during submit):
disabled={!title.trim() || generating || submitting}
```

**Step 2: Verify the build compiles**

Run: `npm run build 2>&1 | tail -5`
Expected: No type errors.

**Step 3: Commit**

```bash
git add src/components/goals/GoalCreateForm.tsx
git commit -m "fix: prevent double-submit on goal creation form"
```

---

## Task 2: Click-outside closes GoalCreateForm + mutual exclusion

**Files:**
- Modify: `src/components/chat/PromptCategories.tsx:56-68,92-96,110-114`

**Context:** Two related bugs: (1) Click-outside handler on line 56-68 only clears `activeCategory`, not `showGoalForm` — so the form stays open when clicking outside. (2) Clicking the Goals tab while the form is open shows both the form AND the dropdown simultaneously.

**Step 1: Extend click-outside to also close the form**

Change the `useEffect` guard on line 57 to fire when either `activeCategory` or `showGoalForm` is set. Close both on outside click:

```tsx
// Lines 56-68 — replace entire useEffect:
useEffect(() => {
  if (activeCategory === null && !showGoalForm) return;

  function handleMouseDown(e: MouseEvent) {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setActiveCategory(null);
      setShowGoalForm(false);
      onPreview?.("");
    }
  }

  document.addEventListener("mousedown", handleMouseDown);
  return () => document.removeEventListener("mousedown", handleMouseDown);
}, [activeCategory, showGoalForm, onPreview]);
```

**Step 2: Add mutual exclusion — Goals tab closes form, "+" closes dropdown**

On the category tab click handler (line 92-96), also close the form:

```tsx
// Lines 92-96 — replace onClick handler:
onClick={() => {
  const next = isActive ? null : category.id;
  setActiveCategory(next);
  setShowGoalForm(false);
  if (!next) onPreview?.("");
}}
```

The "+" button already closes the dropdown (`setActiveCategory(null)` on line 113). No change needed there.

**Step 3: Verify the build compiles**

Run: `npm run build 2>&1 | tail -5`
Expected: No type errors.

**Step 4: Commit**

```bash
git add src/components/chat/PromptCategories.tsx
git commit -m "fix: click-outside closes goal form, mutual exclusion with dropdown"
```

---

## Task 3: Fix invalid HTML — label wrapping button

**Files:**
- Modify: `src/components/goals/GoalSignalPanel.tsx:56-77`

**Context:** Line 56 uses `<label>` to wrap a `<button>` toggle. This is invalid HTML — labels should only wrap form inputs. The whole toggle area should be a `<div>` instead, and clicking the text/icon should also toggle (same as clicking the button).

**Step 1: Replace label+button with div+click handler**

Replace lines 56-77 with:

```tsx
{/* Signal capture toggle */}
<div
  onClick={captureDisabled ? undefined : onTogglePollinate}
  className={`flex items-center gap-1.5 ${captureDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
  role="switch"
  aria-checked={goal.crossPollinate && !captureDisabled}
  aria-label="Capture signals"
>
  <Radio
    size={12}
    className={goal.crossPollinate && !captureDisabled ? "text-accent" : "text-text-tertiary"}
  />
  <span className="text-xs text-text-secondary">
    Capture signals
  </span>
  <span
    className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
      goal.crossPollinate && !captureDisabled ? "bg-accent" : "bg-border"
    }`}
  >
    <span
      className={`inline-block h-3 w-3 rounded-full bg-white transition-transform ${
        goal.crossPollinate && !captureDisabled ? "translate-x-3.5" : "translate-x-0.5"
      }`}
    />
  </span>
</div>
```

Key changes: `<label>` → `<div>` with `role="switch"`, `<button>` → `<span>` (visual only), click handler on the outer `<div>`.

**Step 2: Verify the build compiles**

Run: `npm run build 2>&1 | tail -5`
Expected: No type errors.

**Step 3: Commit**

```bash
git add src/components/goals/GoalSignalPanel.tsx
git commit -m "fix: replace invalid label-wrapping-button with accessible switch pattern"
```

---

## Task 4: Remove dead setCrossPollination function

**Files:**
- Modify: `src/hooks/useGoalStore.ts:88-94`

**Context:** `setCrossPollination` was written in the plan but never imported. The actual logic uses `updateGoalStatus` with `disableCapture` flag (added in commit `e7d01d7`). Dead code.

**Step 1: Delete the function**

Remove lines 88-94 entirely:

```tsx
// DELETE:
export async function setCrossPollination(id: string, value: boolean): Promise<void> {
  const chat = await getChat(id);
  if (chat?.goal) {
    chat.goal.crossPollinate = value;
    await set(chatKey(id), { ...chat, updatedAt: Date.now() });
  }
}
```

**Step 2: Verify no imports reference it**

Run: `grep -r "setCrossPollination" src/`
Expected: No results (only the definition should have existed).

**Step 3: Commit**

```bash
git add src/hooks/useGoalStore.ts
git commit -m "fix: remove dead setCrossPollination function"
```

---

## Task 5: Show error feedback when Generate fails

**Files:**
- Modify: `src/components/goals/GoalCreateForm.tsx:22,33-41,75-96`

**Context:** The `handleGenerate` catch block silently swallows errors. User sees the spinner stop with no feedback. Add a brief inline error message that auto-clears.

**Step 1: Add error state and show/clear it**

```tsx
// Line 22 area — add after generating state:
const [generateError, setGenerateError] = useState(false);

// Lines 24-42 — update handleGenerate:
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
```

After the closing `</div>` of the textarea wrapper (after line 96), add:

```tsx
{generateError && (
  <p className="text-xs text-red-500 -mt-1">Generation failed — try again or write your own</p>
)}
```

**Step 2: Verify the build compiles**

Run: `npm run build 2>&1 | tail -5`
Expected: No type errors.

**Step 3: Commit**

```bash
git add src/components/goals/GoalCreateForm.tsx
git commit -m "fix: show error feedback when goal prompt generation fails"
```

---

## Task 6: Batch retroactive signal scan to reduce HTTP calls

**Files:**
- Modify: `src/hooks/useGoalStore.ts:108-170`

**Context:** `scanExistingChatsForSignals` makes one HTTP call per message (up to 30). Batch all messages from a single chat into one concatenated text block per API call, reducing calls from ~30 to ~10.

**Step 1: Rewrite the scan loop to batch per chat**

Replace lines 108-170 with:

```tsx
/**
 * Scan existing regular chats for signals relevant to a newly created goal.
 * Best-effort, non-blocking — intended to be called fire-and-forget.
 * Batches all assistant messages per chat into a single API call.
 */
export async function scanExistingChatsForSignals(
  goalId: string,
  title: string,
  description: string,
  category?: string,
): Promise<number> {
  try {
    const regularChats = await listRegularChats();
    const recentChats = regularChats.slice(0, 10);
    let totalSignals = 0;

    for (const chat of recentChats) {
      const assistantMessages = chat.messages
        .filter((m) => m.role === "assistant")
        .slice(-3);

      // Batch: concatenate all qualifying messages for this chat
      const batchedTexts: { msgId: string; text: string }[] = [];
      for (const msg of assistantMessages) {
        const text =
          msg.parts
            ?.filter(
              (p): p is { type: "text"; text: string } => p.type === "text",
            )
            .map((p) => p.text)
            .join("") || "";
        if (text.length > 50) {
          batchedTexts.push({ msgId: msg.id, text: text.slice(0, 2000) });
        }
      }

      if (batchedTexts.length === 0) continue;

      // Single API call per chat with all messages concatenated
      const combined = batchedTexts.map((t) => t.text).join("\n---\n");
      const resp = await fetch("/api/detect-signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responseText: combined.slice(0, 4000),
          goals: [{ id: goalId, title, description, category: category || "" }],
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.signals && data.signals.length > 0) {
          // Use the last message ID as source for all signals from this chat
          const sourceMessageId = batchedTexts[batchedTexts.length - 1].msgId;
          for (const sig of data.signals) {
            await saveSignal({
              id: nanoid(10),
              goalId: sig.goalId,
              sourceChatId: chat.id,
              sourceMessageId,
              summary: sig.summary,
              category: sig.category,
              createdAt: Date.now(),
            });
            await incrementGoalSignals(sig.goalId);
            totalSignals++;
          }
        }
      }
    }

    return totalSignals;
  } catch {
    // Best-effort — don't break goal creation if scanning fails
    return 0;
  }
}
```

Key change: instead of looping `for (const msg of assistantMessages)` with individual fetch calls, we concatenate all messages per chat separated by `---` and make one call. `responseText` limit increased to 4000 chars to accommodate the batched content.

**Step 2: Verify the build compiles**

Run: `npm run build 2>&1 | tail -5`
Expected: No type errors.

**Step 3: Commit**

```bash
git add src/hooks/useGoalStore.ts
git commit -m "fix: batch retroactive signal scan to one API call per chat"
```

---

## Task 7: Form/dropdown mutual exclusion (already handled in Task 2)

This is handled as part of Task 2. No separate task needed.

---

## Task 8: Preserve visual distinction for completed goals

**Files:**
- Modify: `src/components/layout/GoalList.tsx:81-89`

**Context:** Completed goals all show `text-text-tertiary` icons, losing the blue (custom) vs copper (predefined) distinction. Instead, preserve the color but add opacity to dim it.

**Step 1: Update the icon className logic**

Replace lines 81-89:

```tsx
<Target
  size={14}
  className={`shrink-0 ${
    goal.goal?.origin === "custom"
      ? "text-blue-500"
      : "text-accent"
  } ${goal.goal?.status === "completed" ? "opacity-40" : ""}`}
/>
```

Instead of switching to `text-text-tertiary` for completed, we keep the origin color and add `opacity-40` to dim it. This preserves the custom vs predefined distinction even in completed state.

**Step 2: Verify the build compiles**

Run: `npm run build 2>&1 | tail -5`
Expected: No type errors.

**Step 3: Commit**

```bash
git add src/components/layout/GoalList.tsx
git commit -m "fix: preserve custom/predefined icon color for completed goals"
```

---

## Summary

| Task | Fix | File | Complexity |
|------|-----|------|------------|
| 1 | Double-submit guard | `GoalCreateForm.tsx` | Trivial |
| 2 | Click-outside + mutual exclusion | `PromptCategories.tsx` | Low |
| 3 | Invalid HTML (label wrapping button) | `GoalSignalPanel.tsx` | Low |
| 4 | Remove dead code | `useGoalStore.ts` | Trivial |
| 5 | Generate error feedback | `GoalCreateForm.tsx` | Low |
| 6 | Batch retroactive scan | `useGoalStore.ts` | Medium |
| 8 | Completed goal visual distinction | `GoalList.tsx` | Trivial |

**Note:** Tasks 1 and 5 both modify `GoalCreateForm.tsx` — implement in order, Task 1 first. Tasks 4 and 6 both modify `useGoalStore.ts` — implement Task 4 first (removal), then Task 6 (rewrite of scan function).
