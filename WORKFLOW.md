# Solo Developer Workflow — Claude Code

This document describes how Claude Code is configured and used for this project.

## Artifacts & Configuration

### CLAUDE.md (project root)
Always-on instructions loaded every session. Keep ≤500 lines. Only include what Claude can't infer from code: build commands, code style deviations, testing preferences, architectural decisions. Prune regularly — if Claude already does it right, delete the rule.

### Memory (~/.claude/projects/.../memory/)
Auto-memory persisted across conversations by Claude Code. MEMORY.md is loaded into every conversation context. Use separate topic files for detailed notes. Claude manages this — avoid duplicating CLAUDE.md content here.

### Skills (.claude/skills/)
On-demand knowledge and invocable workflows. Loaded only when relevant (low context cost). Use for repeatable instructions, domain reference, and slash commands. Current: `frontend-design`.

### Hooks (.claude/settings.json)
Deterministic scripts that run outside the agentic loop — guaranteed to fire, unlike CLAUDE.md instructions. Starter hooks for this project:
- **PostToolUse (Edit|Write)** — auto-format with Prettier after every file edit
- **Notification** — desktop notification when Claude needs input
- **PreToolUse (Edit|Write)** — block edits to `.env` and lock files

### Permissions (.claude/settings.local.json)
Allowlisted commands that skip permission prompts. Configured per-project in `settings.local.json` (gitignored). Use `/permissions` to add safe commands. Current allowlist: git, npm, npx, tsc, lsof, WebSearch/WebFetch for specific domains.

### MCP Servers
External tool connections. Currently configured: Claude in Chrome (browser automation for roundtrip UI evaluation). Add MCP servers with `claude mcp add`. Use for: databases, Slack, Figma, issue trackers.

### Subagents
Isolated context workers for research tasks. Use when exploring the codebase to avoid filling the main context window. Claude reports back summaries only. Also useful for code review from a fresh perspective.

### Intent Documents (intents/)
Developer intent and instructions for features. Each file scopes one feature. These are the "what to build" specs that Claude references during implementation.

### Claude in Chrome
Browser automation via MCP for roundtrip evaluation: build → view in browser → find issues → fix → confirm fixes. Always prefer Claude in Chrome over Playwright unless explicitly asked otherwise.

## Development Cycle

### 1. Explore (Plan Mode)
Enter Plan Mode (Shift+Tab). Claude reads files and answers questions without making changes. Scope investigations narrowly or use subagents to avoid filling context.

### 2. Plan (Plan Mode)
Ask Claude for a detailed implementation plan. Review the plan. Press Ctrl+G to edit the plan in your editor. For small, obvious changes — skip planning.

### 3. Implement (Normal Mode)
Switch to Normal Mode and let Claude code against its plan. Provide verification criteria: tests to run, screenshots to compare, expected outputs.

### 4. Verify
Give Claude a way to check its work: run tests, use Claude in Chrome for UI verification, check linter output. This is the single highest-leverage practice.

### 5. Commit
Ask Claude to commit with a descriptive message and optionally create a PR. Use `/commit` skill or ask directly.

## Session Management

- **/clear** between unrelated tasks — context pollution is the #1 performance killer
- **/compact** with focus instructions when context grows large
- **/rename** sessions descriptively (e.g., "auth-refactor") for easy --resume later
- **--continue** to resume the most recent session, **--resume** to pick from history
- After 2 failed corrections, /clear and start fresh with a better prompt
- Delegate research to subagents to keep the main context clean
