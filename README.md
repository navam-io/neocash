<p align="center">
  <img src="docs/screenshots/hero.png" width="800" alt="NeoCash — Personal Wealth Manager" />
</p>

<h1 align="center">NeoCash</h1>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache_2.0-22c55e?style=flat" alt="Apache 2.0 License" /></a>
  <img src="https://img.shields.io/badge/Next.js_16-000000?style=flat&logo=nextdotjs" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/Claude_AI-c4704b?style=flat&logo=anthropic&logoColor=white" alt="Claude AI" />
  <img src="https://img.shields.io/badge/TypeScript-3178c6?style=flat&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Local--First-0d9488?style=flat" alt="Local-First" />
</p>

<p align="center"><strong>Personal wealth management, without the institution.</strong></p>

---

## Your money. Your data. Your device.

NeoCash is an AI wealth advisor that runs entirely on your machine. No accounts to create. No cloud sync. No one watching. Your financial conversations, documents, and decisions stay in your browser's local storage — always.

Powered by Claude, five specialized financial agents handle tax strategy, retirement planning, budgeting, investment allocation, and estate planning — coordinated through 18 AI tools whose actions are always visible. It remembers your financial profile across conversations, detects connections between topics, tracks your goals automatically, and runs deep background analysis when the question demands it.

---

## Start a conversation about what matters

<p align="center">
  <img src="docs/screenshots/chat.png" width="800" alt="Chat conversation with budget analysis" />
</p>

Choose from eight wealth categories — tax, investing, retirement, budgeting, debt, insurance, estate planning, and business income. Each conversation gets Claude's full reasoning with markdown tables, calculations, and specific dollar amounts. Upload documents, search the web, or switch between Claude models mid-conversation.

---

## Five specialist agents, one conversation

Ask about tax-loss harvesting and a **Tax Advisor** steps in. Discuss portfolio rebalancing and the **Portfolio Analyzer** takes over. Each specialist — Tax Advisor, Portfolio Analyzer, Budget Planner, and Estate Planner — carries a domain-specific tool subset and tailored system prompt, while the **Generalist** handles everything else.

Routing is instant: goal threads match by category, non-goal messages are classified by a fast Haiku call with keyword fallback. A copper agent chip appears before each specialist response so you always know who's talking.

---

## Every AI action, visible

<p align="center">
  <img src="docs/screenshots/chat.png" width="800" alt="Tool-call chips in conversation" />
</p>

NeoCash exposes 18 AI tools as collapsible chips inline with the conversation — `save_memory`, `update_dashboard`, `save_signal`, `generate_dashboard`, and more. Each chip shows a working spinner, a green check on success, or a red error state. Click to expand and inspect the full input and output JSON.

Extended thinking blocks show Claude's reasoning process with an adaptive token budget that scales with question complexity.

---

## Deep analysis runs in the background

Complex questions that span multiple goals — like a full financial health check — trigger a background agent powered by the Claude Agent SDK. Four sub-agents (tax, portfolio, budget, estate) run autonomously against your data through an MCP bridge, while SSE streaming keeps you updated with real-time progress in the UI.

The `run_background_agent` tool is available to every specialist, so any conversation can escalate to deep analysis when the question demands it.

---

## Set goals. Let the AI connect the dots.

### Create goals from any starting point

<p align="center">
  <img src="docs/screenshots/goals.png" width="800" alt="Custom goal creation form" />
</p>

Pick from eight wealth categories or create a custom goal. Enter a title and let the AI generate a detailed prompt — or write your own. Each goal becomes a dedicated thread that monitors your other conversations for relevant signals.

### Signals flow between conversations

<p align="center">
  <img src="docs/screenshots/signals.png" width="800" alt="Cross-pollinated signals between conversations" />
</p>

Discussing tax-loss harvesting in one chat? The AI detects that the savings could fund your emergency fund goal in another. Signals are categorized, summarized, and linked back to their source conversation — cross-pollination happens automatically in the background.

### Metrics that populate as you talk

<p align="center">
  <img src="docs/screenshots/goal-dashboard.png" width="800" alt="Goal thread with dashboard metrics" />
</p>

Open the Dashboard panel on any goal to see current balance, target progress, action items with checkboxes, and color-coded insights. Everything populates from your conversations — no manual data entry required.

---

## It remembers so you don't have to

<p align="center">
  <img src="docs/screenshots/memory.png" width="800" alt="Memory editor showing financial profile" />
</p>

NeoCash builds a persistent financial profile from your conversations — income, filing status, account balances, key decisions. Facts are injected into every conversation. Decisions are keyword-matched when relevant. You stay in control: edit, delete, or add memories manually through the Memory editor.

---

## Research when you need it

<p align="center">
  <img src="docs/screenshots/context-menu.png" width="800" alt="Context menu with research options" />
</p>

Upload spreadsheets, PDFs, and documents for analysis. Switch to research mode for deeper exploration. Search the web for current rates, tax rules, or market data — all without leaving the conversation.

---

## Built for mobile too

<p align="center">
  <img src="docs/screenshots/mobile.png" width="280" alt="Mobile view" />
</p>

---

## Quick Start

```bash
git clone https://github.com/manavsehgal/neocash.git
cd neocash
cp .env.example .env.local  # add your Anthropic API key
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000). Click your profile at the bottom left → **Load Sample Data** to explore the full experience with pre-built conversations, goals, signals, and memories.

---

## Built With

| Technology | Purpose |
|-----------|---------|
| [Next.js 16](https://nextjs.org) | App Router, React Server Components |
| [Vercel AI SDK v4](https://sdk.vercel.ai) | Streaming chat, tool use, transport layer |
| [Claude](https://anthropic.com) | Sonnet 4.6 (default), Haiku for classification and signals |
| [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk) | Autonomous background analysis with MCP bridge |
| [Tailwind CSS 4](https://tailwindcss.com) | Design tokens, responsive layout |
| [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) | Local-first persistence via idb-keyval |
| [TypeScript](https://typescriptlang.org) | End-to-end type safety |
| [Vitest](https://vitest.dev) | 359 unit tests across 20 test files |

---

## Architecture

```
src/
├── app/
│   ├── api/chat/              # streamText with agent routing and tool subsets
│   ├── api/background-agent/  # Claude Agent SDK orchestrator (120s timeout)
│   ├── api/detect-signals/    # Haiku-powered cross-pollination
│   └── chat/[chatId]/         # Dynamic chat + goal thread pages
├── components/
│   ├── chat/                  # ChatPanel, MessageList, ToolCallChip, AgentChip
│   ├── layout/                # Sidebar, MemoryList, DocumentList
│   └── ui/                    # Shared primitives
├── context/                   # AppContext (sidebar state, reactivity)
├── hooks/                     # IndexedDB stores (chat, goal, signal, memory, document)
├── lib/
│   ├── agent-profiles.ts      # 5 agent profiles with tool subsets
│   ├── agent-router.ts        # 3-tier routing (goal → Haiku → keyword)
│   ├── tool-schemas.ts        # 18 tool definitions (6 read, 12 write)
│   ├── tool-executor.ts       # Client-side tool dispatch to IndexedDB
│   ├── tool-labels.ts         # Human-friendly tool metadata
│   └── __tests__/             # 359 unit tests across 20 files
├── mcp/                       # MCP bridge for Agent SDK background tasks
└── types/                     # Shared TypeScript interfaces
```

**Key patterns:**

- **Local-first**: All data lives in IndexedDB with `idb-keyval`. No server database, no user accounts.
- **Specialist routing**: Goal threads route instantly by category; non-goal messages classified by Haiku with keyword fallback.
- **18 visible tools**: Schema-only on server, client-side execution via `onToolCall` → collapsible chips with working/done/error states.
- **MCP bridge**: IndexedDB snapshot → temp JSON → in-process MCP server → Agent SDK sub-agents → diffs applied back.
- **Message windowing**: Long conversations are windowed to stay within context limits while preserving recent history.
- **Reactive sidebar**: `goalListVersion`, `memoryListVersion`, and `documentListVersion` counters in AppContext trigger re-fetches across components.

---

## Contributing

```bash
# Run 359 unit tests
npx vitest run

# Development
npm run dev

# Type check
npx tsc --noEmit
```

Fork → branch → PR. Keep it local-first. No cloud dependencies. Tests cover all `src/lib/` and `src/mcp/` pure functions.

---

## License

[Apache 2.0](LICENSE)
