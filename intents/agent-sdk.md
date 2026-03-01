# Agent SDK

Evaluate Claude Agent SDK for multi-agent orchestration with specialized financial agents.

## Current State

- 15 tools with client-side execution via `onToolCall` → `executeToolCall` → `addToolOutput`
- Single-agent loop: one model call chain with up to 10 round-trips
- All tool schemas defined in `src/lib/tool-schemas.ts`, executed in `src/lib/tool-executor.ts`

## Goals

### 1. Evaluate Agent SDK Fit

- Review https://platform.claude.com/docs/en/agent-sdk/overview and TypeScript SDK
- Compare current `useChat` + `onToolCall` pattern vs Agent SDK orchestration
- Assess whether Agent SDK provides value over current tool-loop approach
- Key question: does Agent SDK enable agent-to-agent delegation or is it just structured tool use?

### 2. Specialized Financial Agents

- **Tax Advisor**: tax bracket analysis, deduction optimization, filing strategy
- **Portfolio Analyzer**: asset allocation review, rebalancing suggestions, risk assessment
- **Budget Planner**: cash flow analysis, spending categories, savings rate tracking
- **Estate Planner**: beneficiary review, trust analysis, estate tax implications

Each agent would have:
- Focused system prompt with domain expertise
- Subset of the 15 tools relevant to its domain
- Ability to read/write goals, signals, dashboard attributes

### 3. Reference Patterns

- Review openvolo project (`/Users/manavsehgal/Developer/openvolo/`) for:
  - Automation cards UI pattern
  - Agent run interface and progress tracking
  - How agent state is surfaced to users
- Read https://www.anthropic.com/engineering/building-effective-agents
- Read https://www.anthropic.com/engineering/writing-tools-for-agents

### 4. User Experience

- Agent selection could be automatic (router agent picks specialist) or user-directed
- Agent handoffs should be visible in the conversation (like tool chips)
- Each agent's reasoning and tool use shown in context
- No hidden background processing — everything in the chat thread

## Open Questions

- Is the Agent SDK mature enough for production use in a Next.js app?
- How does Agent SDK handle streaming to the UI vs current `useChat` transport?
- Cost implications of multi-agent orchestration (multiple model calls per user query)?
