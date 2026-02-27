import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import type { DashboardSchema } from "@/types";

interface GoalInput {
  id: string;
  title: string;
  description: string;
  category: string;
  dashboardSchema?: DashboardSchema;
}

export async function POST(req: Request) {
  try {
    const { responseText, goals } = await req.json();

    if (!responseText || !goals || goals.length === 0) {
      return Response.json({ signals: [] });
    }

    const truncated = responseText.slice(0, 2000);

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
        return entry;
      })
      .join("\n");

    const baseInstruction = `You analyze financial conversation text and determine if it's relevant to any active financial goals. Return ONLY a JSON array of matches. Each match should have: goalId (string), summary (one sentence explaining the relevance), category (e.g. "tax_insight", "investment_signal", "budget_update", "savings_progress", "market_signal"). If no goals match, return an empty array []. Be selective — only flag genuinely relevant insights, not tangential mentions.`;

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
