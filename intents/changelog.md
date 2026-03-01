# Changelog

Living tracker of feature intents and their implementation status.

## Implemented

### Project Foundation — [`intents/claude-clone.md`](intents/claude-clone.md)

Core Claude AI chat interface clone for personal wealth management.

- Claude AI chat interface with streaming responses
- NeoCash wealth management prompts (5 categories, 25 prompts)
- Privacy-first local storage via IndexedDB
- Multi-model selection (Sonnet 4.5, Haiku 3.5, Opus 4)
- Sidebar with chat history, responsive design, markdown rendering
- Full-width chat messages without avatars
- Dev indicators disabled for clean UI

**Commits:** `8d088d3` Add NeoCash wealth management chat app · `2ffd766` Disable Next.js dev indicators · `bbaaab4` Remove avatars and use full width for chat messages

---

### Prompt Box UI Refinement — [`intents/prompt-box-ui.md`](intents/prompt-box-ui.md)

Match Claude AI prompt box behavior for polished input experience.

- Model selector moved to right side of prompt box
- Send button hidden when prompt is empty
- Animated hide/show of suggested prompts on input focus/blur
- Click suggestion pre-fills prompt without sending

**Commits:** `6299eed` Match Claude AI prompt box behavior: move ModelSelector right, hide SendButton when empty, animate categories on input, pre-fill suggestions

---

### Context Dropdown — [`intents/context-dropdown.md`](intents/context-dropdown.md)

Add a + icon dropdown in the prompt box for context and mode controls.

- Context dropdown (`+` button) with 3 items: Add images, Research mode, Search the web
- Image attachments with thumbnail preview, hover-to-remove, and API delivery via pendingFiles ref
- Research mode toggle with extended thinking (10k token budget) and pill indicator
- Web search toggle with Anthropic web search tool and pill indicator
- Dual-mode combinations with multiple pill indicators
- Outside-click dropdown dismiss, check icons for active toggles

**Commits:** `490b416` Add context dropdown with image attachments, research mode, and web search · `ae08f6f` Fix image attachments not sent to API during new chat redirect

---

### Document Upload & Management — [`intents/document-upload.md`](intents/document-upload.md)

Upload wealth-management documents and manage them from the sidebar.

- "Add documents" context menu item supporting PDF, DOCX, XLSX, CSV, MD, TXT, JSON
- File size validation (10MB limit) with graceful rejection
- Document preview pills in input area with file-type-colored icons (red PDF, green Excel, blue Word)
- Document attachment pills rendered in user chat messages
- IndexedDB document store with dedup by filename (most recent conversation wins)
- Collapsible "Documents" sidebar section with count badge, metadata subtext, click-to-navigate
- AI-generated metadata extracted from assistant responses (e.g., "W2 Form, Acme Corp")
- Cascade-ready document cleanup for future chat deletion

**Commits:** `06c21a3` Add document upload and document management sidebar

---

### Goal Threads — [`intents/wealth-goals.md`](intents/wealth-goals.md)

Persistent goal threads with AI-powered cross-pollination for wealth management objectives.

- Goal creation via sidebar "+" button with inline form (title + optional category)
- Goal creation via new "Goals" prompt category tab (6th tab with 5 goal-oriented prompts)
- Goal threads as specialized chat threads with goal-specific system prompts
- Goal signal panel HUD with status control (Active/Paused/Completed), cross-pollination toggle, and signal list
- Cross-pollination: Haiku auto-detects relevance of regular chat responses to active goals
- Signal records stored in IndexedDB with source traceability ("View source" links)
- Sidebar Goals section between Documents and Chats with copper Target icons, status dots, and signal counts
- ChatList filtered to exclude goal threads (goals shown in dedicated section)
- Per-goal cross-pollination toggle (on by default)
- Goal title displayed in signal panel header with Target icon and vertical divider
- Clean goal titles from Goals prompt tab (uses prompt.title instead of truncated prompt text)
- Goals tab copper accent styling to stand out from other category tabs
- Retroactive signal scanning: new goals scan last 10 existing chats for relevant signals on creation
- Reactive signal panel updates when background scan completes

**Commits:** `4786878` Add goal threads with cross-pollination, signal detection, and retroactive scanning · `5e6b5b0` Fix retroactive signals not appearing reactively in goal signal panel

---

### Improve Goals — [`intents/improve-goals.md`](intents/improve-goals.md)

UX polish, signal quality improvements, and discoverability enhancements for Goal Threads.

- Click-outside-to-dismiss for all category dropdowns on new chat screen
- Existing goals shown in Goals dropdown with Target icon and signal count pill (click navigates, no duplication)
- Goal creation "+" moved from sidebar to Goals tab on new chat screen
- "Cross-pollinate" renamed to "Capture signals" in goal signal panel
- Signal capture toggle grays out and auto-disables when goal is paused or completed
- AI-generated goal descriptions via Haiku: "Generate" button creates structured prompt from title
- Goal description textarea in creation form (user can review/edit before saving)
- Description flows into IndexedDB, signal detection prompt, and kickoff message
- Signal detection API now includes goal description for richer Haiku matching
- Visual distinction: custom goals get blue icons, predefined goals keep copper accent
- `origin` field on GoalMeta for backwards-compatible custom/predefined discrimination
- Hover-to-preview: hovering goal prompts in dropdown shows prompt text as input placeholder

**Commits:** `a4cf8b8` Click-outside-to-dismiss · `404d884` Show existing goals in dropdown · `bd9b88f` Move "+" to Goals tab · `b2c9fba` Rename to "Capture signals" · `383c182` Disable capture when paused/completed · `1758dee` AI-generated goal descriptions · `d6902de` Include description in signal detection · `9fd0e91` Visual distinction for goal types · `f487dbd` Hover-to-preview prompts · `e7d01d7` Code review fixes

---

### Data Management — [`intents/data-management.md`](intents/data-management.md)

Inline delete, full reset, and sample data loading for NeoCash.

- Inline delete with hover-to-reveal trash icon on Chats, Goals, and Documents
- Two-step inline confirmation (no modal dialogs)
- Cascade-aware deletes (goal → signals + docs, chat → docs)
- Post-delete navigation to home if active item deleted
- User profile menu with "Reset All Data" and "Load Sample Data" actions
- Sample data: 3 chats, 2 goals, 3 signals, 3 documents (fictional, no PII)
- Dynamic import for sample data module (kept out of main bundle)

**Commits:** `6a16b62` Add data management — inline delete, reset, and sample data

---

### Goal Dashboard — [`intents/goal-dashboard.md`](intents/goal-dashboard.md)

LLM-generated metric tracking for goal threads with structured dashboard panel.

- Haiku analyzes goal title/description to generate 3-8 typed schema attributes (currency, percent, date, text, boolean, number)
- Right-side detail panel (320px desktop, bottom sheet on mobile) with split-view layout
- Type-appropriate formatting: currency via `Intl.NumberFormat`, dates in locale format, booleans as check/X icons
- Empty attributes show "--" until a signal populates them
- Completion indicator ("3 of 5 tracked") for at-a-glance progress
- Inline schema editor: rename attributes, change types, add/remove (max 8)
- Signal detection enhanced to extract typed `extractedValues` matching dashboard schema
- System prompt sees current dashboard state (known/missing values) for proactive follow-up
- Backward compatible: goals without schema show no Dashboard toggle

**Commits:** `39c26db` Add goal dashboard — LLM-generated metric tracking · `d5cf134` Fix dashboard toggle wrapping

---

### Context Overflow — [`intents/context-overflow.md`](intents/context-overflow.md)

Message windowing and error handling for conversations exceeding the ~200K token context window.

- "Lossless-recent, lossy-old" message windowing with 160K token budget
- Recent messages preserved with full file content; older messages get file parts replaced with placeholders
- Token estimation at ~4 chars/token for text, base64 size calculation for files
- Context overflow error detection from Anthropic SDK with structured error response (HTTP 413)
- Dismissible amber warning banner above chat input
- Error clears on next successful response

**Commits:** `6e5ab4b` Fix context overflow, upgrade signal detection, add actionable dashboard

---

### Document Extraction — [`intents/document-extraction.md`](intents/document-extraction.md)

Server-side text extraction for DOCX and XLSX uploads so Claude can reason about document contents.

- `mammoth` (DOCX to text) and `xlsx`/SheetJS (XLSX to CSV) — pure JS, no native deps
- Dynamic `await import()` keeps libraries server-only (no client bundle bloat)
- 50,000 character truncation cap (~12,500 tokens)
- Extracted text wrapped in `--- Content from filename ---` delimiters
- Transparent to user — no UI changes, conversion happens in message-windowing layer
- Builds on initial `stripUnsupportedFileParts()` fix that prevented silent API failures

**Commits:** `2fc2c76` Strip unsupported file types before sending to API · `7058bd8` Extract text from DOCX/XLSX uploads server-side

---

### Auto-Suggest Category & Mandatory Fields

AI-powered category auto-suggestion and mandatory description/category for custom goal creation.

- Generate button moved beside title field (out of textarea) for clearer UX
- `/api/generate-goal-prompt` now returns JSON `{ prompt, suggestedCategory }` in one call
- New `/api/suggest-category` endpoint — lightweight Haiku classifier triggered on description blur
- Category auto-fills with sparkle icon when AI-suggested; user's manual pick always wins
- Description and category now mandatory with validation hints on submit attempt
- Markdown fence stripping for robust LLM JSON parsing
- Exported `categoryIds` from `prompts.ts` for centralized validation across API routes

**Commits:** `ed491a9` Add AI auto-suggest category and mandatory fields for custom goal creation

---

### Auto-Completion & Action Progress — [`intents/auto-actions.md`](intents/auto-actions.md)

AI-powered detection of completed goal action items from conversation context with visual progress tracking.

- Haiku analyzes assistant responses against pending action items after each goal-thread reply
- Detects implicit completions from user confirmation language (e.g., "I filed the form")
- Auto-toggles action items with recently-completed visual feedback (copper pulse animation)
- Mini progress bar (4px copper) showing completed/total action item fraction in dashboard
- Fire-and-forget processing in `onFinish` (replaced by tool-based `complete_action_item` in Multi-Agent)

**Commits:** `5e2e89d` Add AI-powered auto-completion detection for goal action items

---

### Unit Test Suite (Phase 1)

Comprehensive unit tests for all `src/lib/` pure functions.

- 99 tests across 9 test files covering memory-processing, message-windowing, file-utils, greeting, document-extraction, signal-text, signal-processing, models, and prompts
- Vitest 4.x with `vi.mock()`, `vi.hoisted()`, `vi.useFakeTimers()` mock strategies
- `helpers.ts` with UIMessage builders for test data construction
- Relative path mocking pattern for `@/hooks/*` modules (alias doesn't resolve in vitest 4.x)

**Commits:** `897c529` Add Phase 1 unit test suite for all src/lib/ pure functions

---

### Multi-Agent Capabilities — [`intents/multi-agent-capabilities.md`](intents/multi-agent-capabilities.md)

Chat-native multi-agent system replacing hidden fire-and-forget processing with 15 transparent, visible tool calls. The AI gains full read+write agency over all financial data with Claude-style collapsible chips in the conversation.

- **Transport switch**: `TextStreamChatTransport` → `DefaultChatTransport` with UI message protocol supporting tool-call parts
- **15 tool schemas** (6 read, 9 write) defined with `tool()` from AI SDK + Zod — schema-only on server, client-side execution via IndexedDB stores
  - READ: `list_goals`, `get_goal`, `list_signals`, `list_memories`, `list_documents`, `list_chats`
  - WRITE: `save_memory`, `update_memory`, `delete_memory`, `save_signal`, `update_dashboard`, `add_action_items`, `complete_action_item`, `add_insights`, `update_goal_status`
- **Client-side tool executor** dispatching tool calls to existing IndexedDB store functions (`processExtractedMemories`, `processDetectedSignals`, goal/memory/signal stores)
- **Tool-call chip UI**: collapsible chips with working (spinner + copper), done (green check), error (red alert) states; expandable JSON detail; grouped parallel calls
- **Parts-based message rendering**: assistant messages walk `message.parts` sequentially — text rendered as markdown, tool invocations as `ToolCallChip` components
- **System prompt tool guidance**: `buildToolInstructions()` with when/when-not rules and common tool-chaining patterns for all 15 tools
- **Fire-and-forget removal**: deleted `/api/extract-memories` and `/api/detect-completions` routes; removed ~190 lines of hidden signal/memory/completion processing from `onFinish`
- **Multi-step tool loops**: `sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls` with `stopWhen: stepCountIs(10)` for up to 10 round-trips
- **Sidebar refresh**: write operations auto-refresh memory/goal lists via `WRITE_TOOLS`, `MEMORY_TOOLS`, `GOAL_TOOLS` sets
- **41 new unit tests** (tool-schemas: 12, tool-executor: 15, tool-labels: 8, plus 6 existing tests updated) — 140 total passing
- CSS animation for tool chips with `prefers-reduced-motion` support

**Commits:** `f68e091` Add chat-native multi-agent capabilities with 15 financial tools

---

### Web Search — [`intents/search.md`](intents/search.md)

Fix web search tool execution and enable Anthropic citation rendering.

- Fixed web search tool not executing (provider tool needs server-side handling, not `onToolCall`)
- `sendSources: true` on `toUIMessageStreamResponse()` to stream `source-url` parts to client
- `SourcesCitation` component: deduplicates sources by URL, renders as 3-column grid of numbered chip links
- Globe icon + "Sources" header, max 10 visible with "show all" toggle, opens in new tab
- `providerToolLabels` map in tool-labels for provider-managed tools (not in allTools schema)
- Web search tool chip shows "Searching the web..." → "Searched the web" (was falling back to generic "Working...")
- Sources persist across page reload via IndexedDB message parts

**Commits:** `e0a6949` Enable web search tool execution · `2c63bad` Enable web search source citations and tool label

---

### Long-Term Memory

Hybrid memory system for cross-conversation user profile persistence.

- Structured profile facts (income, filing status) + key financial decisions (chose Roth, started 529)
- Tool-based extraction: model calls `save_memory` tool when user shares concrete data (visible via chip)
- `MemoryRecord` with `key` field as dedup anchor — same key with new value updates existing record
- Tiered injection: facts always in system prompt (~200 tokens), decisions keyword-matched against user message (top 5)
- Caps: 50 facts / 20 decisions, prunes lowest-confidence oldest when at cap
- Confidence threshold: 0.7 minimum for extraction
- MemoryList sidebar (collapsible, top 5 facts), MemoryEditor modal (tabs: facts/decisions, inline edit)
- `memoryListVersion` in AppContext triggers reactive refetch across components

**Commits:** `5bfdf4f` Add long-term memory system for cross-conversation user profile · `e0a6949` Strengthen memory prompt framing

---

### Signal Intelligence — [`intents/signal-intelligence.md`](intents/signal-intelligence.md)

Comprehensive upgrades to signal detection quality, goal thread self-awareness, smart text preparation, and chat verbosity control.

- Goal thread self-signal detection (threads detect signals from their own messages)
- Retroactive self-scan on goal thread load for goals with dashboard schemas
- Actionable dashboard: Action Items (checkable, prioritized) and Insights (typed, dismissible)
- Shared `processDetectedSignals()` helper eliminating 3x code duplication
- Smart signal text preparation: 15K char budget with head+tail windowing, financial-density scoring
- Chat verbosity reduction: system prompt conciseness guidelines, conversational tone
- Signal detection quality gates: max 3 actions + 2 insights, quality gate on concrete data
- Deduplication context: existing items passed to API, few-shot examples in prompt
- Model optimized to Haiku 4.5 for signal detection (cost effective)
- Hard caps: 15 non-completed action items and 10 active insights per goal
- Detection threshold raised from 50 to 200 characters

**Commits:** `6e5ab4b` Fix context overflow, upgrade signal detection, add actionable dashboard · `af2b43c` Improve signal detection quality, chat conciseness, and smart text prep

---

### Goals-First Experience — [`intents/more-goals.md`](intents/more-goals.md)

Transform suggested prompts into a goals-first experience with comprehensive wealth management categories.

- Prompt system restructured from chat prompts to 8 goal-oriented categories
- Categories cover major wealth management lifecycle: investing, taxes, retirement, estate, insurance, debt, education, real estate
- Goal prompts generalized (no hardcoded years)
- Dashboard schema generation adapted for new category structure
- Restored dashboard and signal capture for predefined goals after restructuring

**Commits:** `79f9f90` Transform prompt system into goals-first experience with 8 categories · `8209a64` Restore dashboard and signal capture for predefined goals

---

## Project Commits

| SHA | Message |
|-----|---------|
| `2c63bad` | Enable web search source citations and tool label |
| `67bb4c7` | Update changelog with multi-agent capabilities, auto-completion, and test suite |
| `f68e091` | Add chat-native multi-agent capabilities with 15 financial tools |
| `78a4de2` | Update changelog with auto-suggest category feature |
| `ed491a9` | Add AI auto-suggest category and mandatory fields for custom goal creation |
| `5e2e89d` | Add AI-powered auto-completion detection for goal action items |
| `897c529` | Add Phase 1 unit test suite for all src/lib/ pure functions |
| `d6dc63c` | Add goal creation screenshot and improve dashboard/signals captures |
| `192d875` | Change license from MIT to Apache 2.0 |
| `82088ba` | Add professional README with screenshots, enriched sample data, and MIT license |
| `e0a6949` | Enable web search tool execution and strengthen memory prompt framing |
| `6b64bf6` | Remove horizontal scrollbar from dashboard panel |
| `79f9f90` | Transform prompt system into goals-first experience with 8 categories |
| `5bfdf4f` | Add long-term memory system for cross-conversation user profile |
| `8209a64` | Restore dashboard and signal capture for predefined goals |
| `af2b43c` | Improve signal detection quality, chat conciseness, and smart text prep |
| `c8babf8` | Add missing intents and update changelog from conversation history |
| `7058bd8` | Extract text from DOCX/XLSX uploads server-side for Claude reasoning |
| `2fc2c76` | Strip unsupported file types (DOCX, XLSX) before sending to Anthropic API |
| `6e5ab4b` | Fix context overflow, upgrade signal detection, add actionable dashboard |
| `d5cf134` | Fix dashboard toggle wrapping to second line in goal panel |
| `39c26db` | Add goal dashboard — LLM-generated metric tracking for goal threads |
| `6a16b62` | Add data management — inline delete, reset, and sample data |
| `46c9b38` | Fix goals dropdown hover shake and preview text overflow |
| `bac3940` | Fix: address code review findings for improve-goals feature |
| `6619484` | Update changelog with improve-goals feature and implementation plan |
| `e7d01d7` | Fix: address code review findings |
| `f487dbd` | Hover-to-preview goal prompts in input box placeholder |
| `9fd0e91` | Visual distinction between custom and predefined goals |
| `d6902de` | Include goal description in signal detection prompt |
| `1758dee` | Add AI-generated goal descriptions with Haiku prompt generation |
| `383c182` | Disable signal capture toggle when goal is paused or completed |
| `b2c9fba` | Rename "Cross-pollinate" to "Capture signals" in goal panel |
| `bd9b88f` | Move goal creation "+" to Goals tab on new chat screen |
| `404d884` | Show existing goals in Goals dropdown with signal counts |
| `a4cf8b8` | Add click-outside-to-dismiss for category dropdowns |
| `5e6b5b0` | Fix retroactive signals not appearing reactively in goal signal panel |
| `4786878` | Add goal threads with cross-pollination, signal detection, and retroactive scanning |
| `06c21a3` | Add document upload and document management sidebar |
| `ae08f6f` | Fix image attachments not sent to API during new chat redirect |
| `490b416` | Add context dropdown with image attachments, research mode, and web search |
| `bbf1902` | Add solo developer workflow reference for Claude Code |
| `604b262` | Rename specs/ to intents/ for feature intent documents |
| `6299eed` | Match Claude AI prompt box behavior |
| `bbaaab4` | Remove avatars and use full width for chat messages |
| `2ffd766` | Disable Next.js dev indicators |
| `8d088d3` | Add NeoCash wealth management chat app |
| `bf03d05` | Initial commit |
