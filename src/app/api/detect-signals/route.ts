import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

export async function POST(req: Request) {
  try {
    const { responseText, goals } = await req.json();

    if (!responseText || !goals || goals.length === 0) {
      return Response.json({ signals: [] });
    }

    const truncated = responseText.slice(0, 2000);

    const goalList = goals
      .map(
        (g: { id: string; title: string; description: string; category: string }) =>
          `- ID: ${g.id} | Title: ${g.title} | Category: ${g.category || "general"}${
            g.description && g.description !== g.title
              ? ` | Description: ${g.description}`
              : ""
          }`,
      )
      .join("\n");

    const { text } = await generateText({
      model: anthropic("claude-haiku-4-5-20251001"),
      system: `You analyze financial conversation text and determine if it's relevant to any active financial goals. Return ONLY a JSON array of matches. Each match should have: goalId (string), summary (one sentence explaining the relevance), category (e.g. "tax_insight", "investment_signal", "budget_update", "savings_progress", "market_signal"). If no goals match, return an empty array []. Be selective — only flag genuinely relevant insights, not tangential mentions.`,
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
