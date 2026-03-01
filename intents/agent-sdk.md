# Agent SDK

Specialized financial agents with focused system prompts and tool subsets, plus future Claude Agent SDK multi-agent orchestration.

## Phase 1: Specialized Agent Routing (Implemented)

Prompt-routing architecture that classifies user queries and selects a specialist agent with a focused system prompt and filtered tool set.

### Architecture

```
User message → /api/chat → classifyQuery() → agentId
                            ├─ "generalist"      → streamText(basePrompt, allTools)
                            └─ "tax_advisor"/etc  → streamText(basePrompt + agentExtension, toolSubset)
                            → Client: AgentChip renders for specialists
```

### Agents

| Agent | Goal Categories | Key Tools |
|-------|----------------|-----------|
| Tax Advisor | tax | list_memories, list_documents, list_goals, save_memory, save_signal, add_action_items, add_insights |
| Portfolio Analyzer | investing, retirement | list_memories, list_goals, list_signals, get_goal, save_memory, save_signal, update_dashboard, add_insights |
| Budget Planner | budgeting, debt | list_memories, list_documents, list_chats, save_memory, add_action_items, complete_action_item, save_signal |
| Estate Planner | estate, life-events | list_memories, list_documents, list_goals, save_memory, save_signal, add_action_items, add_insights |
| Generalist | business, unmapped | all 17 tools |

### Three-Tier Classification

1. **Goal category override** (instant) — goal threads route by category
2. **Haiku classifier** (~200ms, ~$0.0001) — lightweight LLM call for non-goal chats
3. **Keyword fallback** (instant) — scores keyword arrays when Haiku is unavailable

### Key Files

- `src/lib/agent-profiles.ts` — agent definitions, tool subsets, prompt extensions
- `src/lib/agent-router.ts` — 3-tier classification (goal → Haiku → keywords)
- `src/lib/tool-schemas.ts` — `getToolSubset()` helper
- `src/lib/system-prompt.ts` — `buildSpecialistSystemPrompt()`
- `src/components/chat/AgentChip.tsx` — specialist badge in chat
- `src/app/api/chat/route.ts` — server-side routing integration

## Phase 2: Claude Agent SDK (Future)

Evaluate Claude Agent SDK for true multi-agent orchestration with subagent delegation.

### Goals

- Review Agent SDK for agent-to-agent delegation patterns
- Compare current prompt-routing vs SDK orchestration
- Assess streaming compatibility with `useChat` + `DefaultChatTransport`
- Consider cost implications of multi-agent round-trips

### Reference Patterns

- Review openvolo project for automation cards UI pattern
- Read https://www.anthropic.com/engineering/building-effective-agents
- Read https://www.anthropic.com/engineering/writing-tools-for-agents
