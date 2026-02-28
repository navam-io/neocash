import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { categoryIds, promptCategories } from "@/lib/prompts";

export async function POST(req: Request) {
  try {
    const { title, category } = await req.json();

    if (!title) {
      return Response.json({ error: "Title is required" }, { status: 400 });
    }

    const currentYear = new Date().getFullYear();
    const categoryList = promptCategories
      .map((c) => `${c.id} (${c.label})`)
      .join(", ");

    const { text } = await generateText({
      model: anthropic("claude-haiku-4-5-20251001"),
      system: `You generate structured, detailed prompts for personal wealth management goals. Given a short goal title, create a rich prompt (2-4 sentences) that:
1. States the goal clearly in first person ("I want to...")
2. Asks for specific, actionable help
3. Mentions concrete areas to explore
4. Matches the style of these examples:

Title: "Start a tax preparation goal for ${currentYear}"
Prompt: "I want to set a goal to prepare for the ${currentYear} tax season. Help me build a month-by-month checklist of what to gather, deadlines to track, and strategies to maximize my refund or minimize what I owe."

Title: "Build an emergency fund plan"
Prompt: "I want to set a goal to build my emergency fund. Help me determine the right target amount based on my expenses, create a savings plan with monthly milestones, and suggest the best accounts to hold it in."

Return a JSON object with exactly these fields:
- "prompt": the generated prompt text (no quotes or explanation)
- "suggestedCategory": the single best-fitting category ID from: ${categoryList}

Return ONLY valid JSON, no markdown fences or extra text.`,
      prompt: `Title: "${title}"${category ? `\nCategory: ${category}` : ""}`,
    });

    // Strip markdown fences if present (Haiku often wraps JSON in ```json ... ```)
    const cleaned = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

    // Try JSON parse first
    try {
      const parsed = JSON.parse(cleaned);
      const result: { prompt: string; suggestedCategory?: string } = {
        prompt: parsed.prompt,
      };
      // Only suggest category when caller didn't already provide one
      if (
        !category &&
        parsed.suggestedCategory &&
        categoryIds.includes(parsed.suggestedCategory)
      ) {
        result.suggestedCategory = parsed.suggestedCategory;
      }
      return Response.json(result);
    } catch {
      // Fallback: treat entire response as prompt text (backward compatible)
      return Response.json({ prompt: cleaned });
    }
  } catch (error) {
    console.error("Goal prompt generation error:", error);
    return Response.json(
      { error: "Failed to generate prompt" },
      { status: 500 },
    );
  }
}
