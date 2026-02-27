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

## Open

### Data Management — [`intents/data-management.md`](intents/data-management.md)

Inline delete, full reset, and sample data loading for NeoCash.

- Inline delete with hover-to-reveal trash icon on Chats, Goals, and Documents
- Two-step inline confirmation (no modal dialogs)
- Cascade-aware deletes (goal → signals + docs, chat → docs)
- Post-delete navigation to home if active item deleted
- User profile menu with "Reset All Data" and "Load Sample Data" actions
- Sample data: 3 chats, 2 goals, 3 signals, 3 documents (fictional, no PII)
- Dynamic import for sample data module (kept out of main bundle)

---

## Project Commits

| SHA | Message |
|-----|---------|
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
