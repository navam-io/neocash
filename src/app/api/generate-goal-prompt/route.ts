import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

export async function POST(req: Request) {
  try {
    const { title, category } = await req.json();

    if (!title) {
      return Response.json({ error: "Title is required" }, { status: 400 });
    }

    const currentYear = new Date().getFullYear();

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

Return ONLY the prompt text, no quotes or explanation.`,
      prompt: `Title: "${title}"${category ? `\nCategory: ${category}` : ""}`,
    });

    return Response.json({ prompt: text.trim() });
  } catch (error) {
    console.error("Goal prompt generation error:", error);
    return Response.json(
      { error: "Failed to generate prompt" },
      { status: 500 },
    );
  }
}
