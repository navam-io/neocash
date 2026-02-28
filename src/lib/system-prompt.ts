import type { GoalMeta, MemoryRecord, SignalRecord } from "@/types";

export const SYSTEM_PROMPT = `You are NeoCash, a knowledgeable and thoughtful personal wealth management assistant. You help users with:

- **Tax Planning**: Tax-efficient strategies, deductions, credits, filing tips, and tax-advantaged accounts.
- **Investing**: Stock analysis, ETF selection, asset allocation, market concepts, and investment strategies.
- **Portfolio Management**: Portfolio construction, rebalancing, diversification, risk assessment, and performance tracking.
- **Budgeting & Savings**: Budget creation, expense tracking, savings strategies, emergency funds, and debt management.
- **Financial Planning**: Retirement planning, estate planning, insurance, and major financial decisions.

## Guidelines

1. **Be precise and actionable.** Give specific numbers, percentages, and concrete steps when possible.
2. **Explain your reasoning.** Help users understand the "why" behind financial concepts.
3. **Consider the full picture.** Ask clarifying questions about the user's situation when needed.
4. **Use examples sparingly.** One brief illustration beats three detailed ones. Show the result — skip intermediate arithmetic.
5. **Stay current.** Reference current tax brackets, contribution limits, and market conditions when relevant.
6. **Format clearly.** Use tables, lists, and structured formatting for complex information.
7. **Be concise.** Lead with the answer, then explain briefly. Use tables for numbers instead of inline calculations. For complex topics, cover one aspect per turn and ask what to dive into next — don't front-load everything into one response.
8. **Prefer conversation over monologue.** After a focused answer, ask one follow-up question to guide the next turn. This keeps the conversation interactive and responses digestible.

## Important Disclaimers

- You provide **educational information and general guidance**, not personalized financial advice.
- Always remind users to consult qualified professionals (CPA, CFP, financial advisor) for decisions involving significant money.
- Never guarantee investment returns or predict market movements.
- Be transparent about limitations and uncertainties.
- When discussing specific financial products, present balanced pros and cons.

## Tone

Warm, professional, and empowering. You want users to feel confident and informed about their financial decisions. Avoid jargon unless you explain it. Be encouraging but honest about risks.`;

export function buildGoalSystemPrompt(
  goalTitle: string,
  goal: GoalMeta,
  signals: SignalRecord[],
): string {
  const recentSignals = signals.slice(0, 10);

  let prompt = SYSTEM_PROMPT;

  prompt += `\n\n## Active Goal Context\n\n`;
  prompt += `You are helping the user work on a specific financial goal:\n\n`;
  prompt += `**Goal:** ${goalTitle}\n`;
  prompt += `**Status:** ${goal.status}\n`;
  if (goal.category) {
    prompt += `**Category:** ${goal.category}\n`;
  }
  if (goal.description && goal.description !== goalTitle) {
    prompt += `**Description:** ${goal.description}\n`;
  }

  if (recentSignals.length > 0) {
    prompt += `\n### Cross-Pollinated Signals\n\n`;
    prompt += `The following insights were detected from the user's other conversations that relate to this goal:\n\n`;
    for (const signal of recentSignals) {
      prompt += `- **[${signal.category}]** ${signal.summary}\n`;
    }
  }

  if (goal.dashboardSchema && goal.dashboardSchema.length > 0) {
    prompt += `\n### Dashboard Tracking\n\n`;
    prompt += `This goal has a dashboard tracking the following metrics:\n\n`;
    for (const attr of goal.dashboardSchema) {
      const val = goal.dashboardValues?.[attr.id];
      if (val !== undefined && val.value !== undefined) {
        prompt += `- **${attr.name}** (${attr.type}): ${val.value}\n`;
      } else {
        prompt += `- **${attr.name}** (${attr.type}): *not yet known*\n`;
      }
    }
    prompt += `\nWhen the user provides information that matches a tracked metric, acknowledge the update. Proactively ask about unknown values when it's natural to do so — don't force it, but weave questions into your advice.\n`;
  }

  prompt += `\n### Goal Thread Behavior\n\n`;
  prompt += `- Stay focused on this specific goal. Keep responses relevant to achieving it.\n`;
  prompt += `- Reference any cross-pollinated signals when they inform your advice.\n`;
  prompt += `- Track progress: acknowledge milestones and suggest concrete next steps.\n`;
  prompt += `- If the user asks something unrelated, gently redirect back to the goal or suggest starting a new conversation.\n`;
  prompt += `- Proactively suggest actions that advance this goal.\n`;
  prompt += `- Keep responses focused — answer the current question, update relevant metrics, and suggest one concrete next step. Let the user drive deeper exploration.\n`;

  return prompt;
}

// ─── Memory Context Builder ─────────────────────

const CATEGORY_ORDER: MemoryRecord["category"][] = [
  "income",
  "employment",
  "tax",
  "accounts",
  "debt",
  "property",
  "family",
  "goals",
  "general",
];

const CATEGORY_LABELS: Record<string, string> = {
  income: "Income",
  employment: "Employment",
  tax: "Tax",
  accounts: "Accounts",
  debt: "Debt",
  property: "Property",
  family: "Family",
  goals: "Goals",
  general: "General",
};

/**
 * Tokenize text into lowercase words for keyword matching.
 */
function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[\s,.\-_:;!?()[\]{}'"\/]+/)
      .filter((w) => w.length > 2),
  );
}

/**
 * Score a decision's keyword relevance against user message tokens.
 */
function scoreDecisionRelevance(
  decision: MemoryRecord,
  messageTokens: Set<string>,
): number {
  if (!decision.keywords || decision.keywords.length === 0) return 0;
  let score = 0;
  for (const kw of decision.keywords) {
    const kwTokens = tokenize(kw);
    for (const t of kwTokens) {
      if (messageTokens.has(t)) score++;
    }
  }
  return score;
}

/**
 * Build memory context string for the system prompt.
 *
 * Facts are always included (~200 tokens), grouped by category.
 * Decisions are keyword-matched against the user message, top 5 included.
 * Returns empty string if no memories exist.
 */
export function buildMemoryContext(
  memories: MemoryRecord[],
  userMessage?: string,
): string {
  if (memories.length === 0) return "";

  const facts = memories.filter((m) => m.type === "fact");
  const decisions = memories.filter((m) => m.type === "decision");

  let context = "\n\n## User Profile (from previous conversations)\n\n";
  let hasContent = false;

  // Facts: always included, grouped by category
  if (facts.length > 0) {
    const grouped = new Map<string, MemoryRecord[]>();
    for (const f of facts) {
      const list = grouped.get(f.category) || [];
      list.push(f);
      grouped.set(f.category, list);
    }

    for (const cat of CATEGORY_ORDER) {
      const items = grouped.get(cat);
      if (!items) continue;
      context += `**${CATEGORY_LABELS[cat] || cat}:** `;
      context += items.map((f) => `${f.value}`).join(" | ");
      context += "\n";
    }
    hasContent = true;
  }

  // Decisions: keyword-matched against user message, top 5
  if (decisions.length > 0) {
    let matched: MemoryRecord[];

    if (userMessage) {
      const messageTokens = tokenize(userMessage);
      const scored = decisions
        .map((d) => ({ mem: d, score: scoreDecisionRelevance(d, messageTokens) }))
        .filter((d) => d.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      matched = scored.map((d) => d.mem);
    } else {
      // No message to match against — include most recent 5
      matched = decisions.slice(0, 5);
    }

    if (matched.length > 0) {
      context += "\n**Key Decisions:**\n";
      for (const d of matched) {
        context += `- ${d.value}`;
        if (d.context) context += ` (${d.context})`;
        context += "\n";
      }
      hasContent = true;
    }
  }

  if (!hasContent) return "";

  context += "\nUse this profile context naturally. Do not repeat it back unless asked.";
  return context;
}
