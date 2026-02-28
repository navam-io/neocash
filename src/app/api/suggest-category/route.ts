import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { categoryIds, promptCategories } from "@/lib/prompts";

export async function POST(req: Request) {
  try {
    const { title, description } = await req.json();

    if (!title || !description) {
      return Response.json({ category: "" });
    }

    const categoryList = promptCategories
      .map((c) => `${c.id} (${c.label})`)
      .join(", ");

    const { text } = await generateText({
      model: anthropic("claude-haiku-4-5-20251001"),
      system: `You classify personal wealth management goals into exactly one category.

Valid categories: ${categoryList}

Return ONLY the category ID (e.g. "tax", "investing", "retirement"). No explanation, no quotes, no punctuation.`,
      prompt: `Title: "${title}"\nDescription: "${description}"`,
    });

    const suggested = text.trim().toLowerCase();
    if (categoryIds.includes(suggested)) {
      return Response.json({ category: suggested });
    }

    return Response.json({ category: "" });
  } catch (error) {
    console.error("Category suggestion error:", error);
    return Response.json({ category: "" });
  }
}
