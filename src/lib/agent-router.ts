import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import {
  agentProfiles,
  getAgentByGoalCategory,
  type AgentId,
} from "@/lib/agent-profiles";

// ─── Tier 3: Keyword Fallback ────────────────────

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,.\-_:;!?()[\]{}'"\/]+/)
    .filter((w) => w.length > 1);
}

export function classifyByKeywords(message: string): AgentId {
  const tokens = tokenize(message);
  const messageLower = message.toLowerCase();
  let bestId: AgentId = "generalist";
  let bestScore = 0;

  for (const [id, profile] of agentProfiles) {
    if (id === "generalist") continue;
    let score = 0;
    for (const keyword of profile.keywords) {
      // Multi-word keywords: check as substring
      if (keyword.includes(" ")) {
        if (messageLower.includes(keyword)) score += 2;
      } else {
        if (tokens.includes(keyword)) score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestId = id;
    }
  }

  return bestScore >= 2 ? bestId : "generalist";
}

// ─── Tier 2: Haiku Classifier ────────────────────

const CLASSIFICATION_PROMPT = `Classify this financial query into exactly one category.
Respond with ONLY the category ID, nothing else.

Categories:
- tax_advisor: tax planning, deductions, credits, filing, tax-advantaged accounts
- portfolio_analyzer: investments, asset allocation, rebalancing, stocks, bonds, ETFs
- budget_planner: budgeting, cash flow, savings, debt payoff, expenses
- estate_planner: wills, trusts, beneficiaries, estate tax, inheritance, POA
- generalist: general financial questions, multiple domains, or unclear`;

async function classifyWithHaiku(message: string): Promise<AgentId | null> {
  try {
    const result = await generateText({
      model: anthropic("claude-haiku-3-5-20241022"),
      system: CLASSIFICATION_PROMPT,
      prompt: message,
      maxOutputTokens: 20,
    });
    const agentId = result.text.trim() as AgentId;
    if (agentProfiles.has(agentId)) return agentId;
    return null;
  } catch {
    return null;
  }
}

// ─── Main Router ─────────────────────────────────

export async function classifyQuery(
  userMessage: string,
  goalCategory?: string,
): Promise<AgentId> {
  // Tier 1: Goal category override (instant, no API call)
  if (goalCategory) {
    return getAgentByGoalCategory(goalCategory);
  }

  // Tier 2: Haiku classification
  const haikuResult = await classifyWithHaiku(userMessage);
  if (haikuResult) return haikuResult;

  // Tier 3: Keyword fallback
  return classifyByKeywords(userMessage);
}
