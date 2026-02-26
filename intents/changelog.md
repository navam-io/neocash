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

## Open

_No open intents._

---

## Project Commits

| SHA | Message |
|-----|---------|
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
