import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import type { DashboardSchema } from "@/types";
import { prepareTextForSignalDetection } from "@/lib/signal-text";

interface GoalInput {
  id: string;
  title: string;
  description: string;
  category: string;
  dashboardSchema?: DashboardSchema;
  existingActionItems?: string[];
  existingInsights?: string[];
}

export async function POST(req: Request) {
  try {
    const { responseText, goals } = await req.json();

    if (!responseText || !goals || goals.length === 0) {
      return Response.json({ signals: [] });
    }

    const truncated = prepareTextForSignalDetection(responseText);

    const hasAnySchema = goals.some((g: GoalInput) => g.dashboardSchema?.length);

    const goalList = goals
      .map((g: GoalInput) => {
        let entry = `- ID: ${g.id} | Title: ${g.title} | Category: ${g.category || "general"}`;
        if (g.description && g.description !== g.title) {
          entry += ` | Description: ${g.description}`;
        }
        if (g.dashboardSchema?.length) {
          const attrs = g.dashboardSchema
            .map((a) => `${a.id} (${a.type}): ${a.name}`)
            .join(", ");
          entry += `\n  Dashboard attributes: [${attrs}]`;
        }
        if (g.existingActionItems?.length) {
          entry += `\n  Already tracked actions: ${g.existingActionItems.join("; ")}`;
        }
        if (g.existingInsights?.length) {
          entry += `\n  Already tracked insights: ${g.existingInsights.join("; ")}`;
        }
        return entry;
      })
      .join("\n");

    const baseInstruction = `You analyze financial conversation text and determine if it's relevant to any active financial goals. Return ONLY a JSON array of matches. Each match should have: goalId (string), summary (one sentence explaining the relevance), category (e.g. "tax_insight", "investment_signal", "budget_update", "savings_progress", "market_signal"). If no goals match, return an empty array []. Be highly selective — only flag when the response contains concrete new information: specific dollar amounts, dates, rates, percentages, or decisions.

Note: Long responses may contain [...] markers indicating omitted sections. Focus on extracting the LATEST/FINAL values for each attribute — if the text shows an updated or revised calculation, use the most recent numbers, not earlier estimates.

When you detect a signal, also extract:
1. "actionItems" — concrete, specific next steps (max 3). Each: { "text": string, "priority": "high" | "medium" | "low" }.
   GOOD: "File Form 8606 for non-deductible IRA contribution of $7,000"
   GOOD: "Rebalance bond allocation from 40% to 30% by selling $12k in BND"
   BAD: "Review your tax situation" (too vague)
   BAD: "Consider consulting a financial advisor" (generic advice)
   Do NOT duplicate items already tracked for this goal (listed under "Already tracked actions"). Omit if none are specific enough.
2. "insights" — new observations only (max 2). Each: { "text": string, "type": "missing_info" | "recommendation" | "warning" | "opportunity" }.
   Only include insights that surface genuinely new information not already covered by tracked insights. Omit if nothing new.`;

    const schemaInstruction = hasAnySchema
      ? `\n\nSome goals have dashboard attributes listed. When you detect a signal for such a goal, also include an "extractedValues" object mapping attribute IDs to concrete values found in the text. Only include values you can extract with confidence. Use appropriate types: numbers for currency/percent/number (no $ or % symbols), ISO date strings for dates, booleans for boolean attributes, plain strings for text. If no values can be extracted, omit extractedValues.`
      : "";

    const { text } = await generateText({
      model: anthropic("claude-haiku-4-5-20251001"),
      system: baseInstruction + schemaInstruction,
      prompt: `## Active Goals\n${goalList}\n\n## Conversation Text\n${truncated}\n\nReturn JSON array of signal matches:`,
    });

    // Parse the JSON from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return Response.json({ signals: [] });
    }

    const signals = JSON.parse(jsonMatch[0]);
    return Response.json({ signals });
  } catch (error) {
    console.error("Signal detection error:", error);
    return Response.json({ signals: [] });
  }
}
