# Signal Intelligence

Comprehensive upgrades to signal detection quality, goal thread self-awareness, smart text preparation, and chat verbosity control.

## Features

### Goal Thread Self-Detection
Goal threads now detect signals from their own messages, not just from cross-pollinated regular chats. Previously, the `if (!goalMeta)` gate blocked signal detection for goal threads entirely.

- Self-detection: when a goal thread gets an assistant response, it detects signals against its own goal
- Retroactive self-scan: on goal thread load, if a goal has a dashboard schema but no signals, it scans the thread's own assistant messages
- Cross-pollination from regular chats still works alongside self-detection

### Actionable Dashboard Intelligence
The dashboard evolved from passive numeric tracking to actionable intelligence.

- **Action Items**: Concrete next steps with priority levels (high/medium/low), checkable completion, sourced from signals
- **Insights**: Categorized observations (missing_info, recommendation, warning, opportunity), dismissible, with type-specific icons
- Signal detection prompt enhanced to extract action items (max 3) and insights (max 2) alongside dashboard values
- Shared `processDetectedSignals()` helper eliminated 3x code duplication across signal processing paths

### Smart Signal Text Preparation
Long assistant responses (e.g., 12K chars for tax calculations) had important data at the END (final totals, revised numbers) beyond the old 6K truncation point.

- 15K character budget with head+tail windowing (first ~5K + last ~5K)
- Financial-density scoring for smart middle extraction: paragraphs scored by financial markers ($-amounts x3, decimals x2, percentages x2, table pipes x1)
- High-scoring paragraphs from the middle selected greedily to fill budget
- "Use latest values" prompt hint tells LLM to prefer most recent/revised numbers

### Chat Verbosity Reduction
System prompt guidelines to produce shorter, more conversational AI responses.

- "Be concise" -- lead with the answer, use tables for numbers, cover one aspect per turn
- "Prefer conversation over monologue" -- ask one follow-up question after each answer
- "Use examples sparingly" instead of encouraging detailed examples
- Goal thread focus instruction

### Signal Detection Quality Gates
Tighter controls to prevent signal accumulation noise.

- Reduced limits: max 3 action items + 2 insights (down from 5+5)
- Quality gate: only signal on concrete new information (dollar amounts, dates, rates, decisions)
- Good/bad few-shot examples in the detection prompt
- Deduplication: existing action items and insights passed to API for context
- Detection threshold raised from 50 to 200 characters
- Model optimized: Haiku 4.5 for structured extraction (down from Sonnet -- cost effective)
- Hard caps: 15 non-completed action items and 10 active insights per goal

## Key Files

| File | Role |
|------|------|
| `src/lib/signal-text.ts` | `prepareTextForSignalDetection()` with financial-density scoring |
| `src/lib/signal-processing.ts` | Shared `processDetectedSignals()` helper |
| `src/lib/system-prompt.ts` | Conciseness guidelines |
| `src/app/api/detect-signals/route.ts` | Quality gates, dedup, model selection, action/insight extraction |
| `src/app/chat/[chatId]/page.tsx` | Self-detection, retroactive scan, detection threshold |
| `src/hooks/useGoalStore.ts` | Action item/insight CRUD, hard caps, `scanGoalThreadForSignals()` |
| `src/components/goals/DashboardActionItems.tsx` | Checkboxes with priority dots, completed collapse |
| `src/components/goals/DashboardInsights.tsx` | Type-specific icons, dismiss buttons |
| `src/types/index.ts` | `ActionItem`, `Insight` types on `GoalMeta` and `SignalRecord` |
