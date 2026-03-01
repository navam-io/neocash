# Dashboard Update Fixes

## Problem

Two bugs prevent dashboard values from persisting in goal threads:

### Bug 1: Race Condition (IndexedDB Write Clobber)

The messages persistence `useEffect` in `page.tsx` runs on every streaming chunk. It reads the chat record, sets `messages`, and writes back the entire record. Meanwhile, tool executor functions like `updateDashboardValues` do the same read-modify-write pattern on the same record. When both are in-flight simultaneously, the last writer wins — and since messages change more frequently, the messages persist almost always overwrites tool-written dashboard values.

**Evidence**: IndexedDB shows `dashboardValues: {}` (empty) despite the `update_dashboard` tool call appearing successful in the UI.

**Scope**: Affects ALL goal-related tool writes: `update_dashboard`, `add_action_items`, `add_insights`, etc.

### Bug 2: Model Only Populates 1 of 10 Dashboard Fields

The model called `update_dashboard` with `{position_initiated: "true"}` instead of all 10 fields from its MSFT buy/sell/hold analysis. The tool description and system prompt don't clearly instruct the model to bulk-populate dashboard fields after completing analysis.

## Solution

### Fix 1: Write Serializer

New file `src/lib/chat-write-lock.ts` — a promise-chain lock keyed by chat ID. Every IndexedDB write for a chat record goes through this lock, ensuring sequential execution.

**Files modified**:
- `src/lib/chat-write-lock.ts` (new)
- `src/hooks/useGoalStore.ts` (wrap all write functions)
- `src/app/chat/[chatId]/page.tsx` (wrap messages persist)

### Fix 2: Prompt Enhancement

Improve the `update_dashboard` tool description and goal thread system prompt to instruct the model to populate ALL dashboard fields it can determine from its analysis, not just fields explicitly mentioned by the user.

**Files modified**:
- `src/lib/tool-schemas.ts` (tool description)
- `src/lib/system-prompt.ts` (goal thread instructions)
