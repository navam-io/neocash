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

## Open

### Context Dropdown — [`intents/context-dropdown.md`](intents/context-dropdown.md)

Add a + icon dropdown in the prompt box for context and mode controls.

- Add files or photos capability
- Research mode toggle
- Web search mode toggle
- Anthropic API best practices integration
- UploadButton component exists as stub

---

## Project Commits

| SHA | Message |
|-----|---------|
| `bbf1902` | Add solo developer workflow reference for Claude Code |
| `604b262` | Rename specs/ to intents/ for feature intent documents |
| `6299eed` | Match Claude AI prompt box behavior |
| `bbaaab4` | Remove avatars and use full width for chat messages |
| `2ffd766` | Disable Next.js dev indicators |
| `8d088d3` | Add NeoCash wealth management chat app |
| `bf03d05` | Initial commit |
