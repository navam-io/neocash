# Eliminate Fire-and-Forget

Replace remaining hidden background processing with tool-driven equivalents visible in the chat.

## Current State

The multi-agent commit (`f68e091`) removed the biggest fire-and-forget offenders:
- ~~`/api/extract-memories`~~ → `save_memory` tool
- ~~`/api/detect-completions`~~ → `complete_action_item` tool

But 3 fire-and-forget patterns remain:

### 1. `scanExistingChatsForSignals()` — Retroactive Goal Scan

**Where:** `GoalCreateForm.tsx` (on goal creation), `useGoalStore.ts`
**What:** Scans last 10 existing chats via `/api/detect-signals` Haiku call
**Problem:** Runs silently in background, signals appear with no user visibility into the process
**Solution:** Convert to a `scan_chats_for_signals` tool the model calls explicitly after goal creation. Shows a tool chip: "Scanning recent chats for signals..."

### 2. `scanGoalThreadForSignals()` — Goal Thread Self-Scan

**Where:** `src/app/chat/[chatId]/page.tsx` (on goal thread load)
**What:** Scans the goal thread itself for signals on page load
**Problem:** Hidden processing on navigation, duplicates work if thread was just active
**Solution:** Convert to a tool or remove entirely — the model now detects signals in real-time via `save_signal` tool during conversation. Self-scan may be unnecessary.

### 3. `/api/generate-dashboard-schema` — Schema Generation

**Where:** Called on first goal thread load when no schema exists
**What:** Haiku generates 3-8 typed dashboard attributes from goal title/description
**Problem:** Hidden API call, schema appears "magically" in dashboard
**Solution:** Convert to a `generate_dashboard` tool. Model calls it when creating a goal with a dashboard. Shows: "Generating dashboard metrics..."

## Design Principle

Every AI-powered operation should be visible as a tool chip in the conversation. No hidden Haiku calls, no silent `onFinish` processing, no background API routes that modify IndexedDB state without the user seeing it happen.

## Migration Strategy

1. Add new tool schemas to `tool-schemas.ts`
2. Add client-side executors to `tool-executor.ts`
3. Update system prompt tool instructions
4. Remove the background API routes / `useEffect` triggers
5. Add unit tests for new tools
