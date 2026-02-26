import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages } from "ai";
import { SYSTEM_PROMPT, buildGoalSystemPrompt } from "@/lib/system-prompt";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, model, researchMode, webSearch, goalContext } = body;

    const systemPrompt = goalContext
      ? buildGoalSystemPrompt(
          goalContext.title,
          goalContext.goal,
          goalContext.signals,
        )
      : SYSTEM_PROMPT;

    const result = streamText({
      model: anthropic(model || "claude-sonnet-4-6"),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      ...(researchMode && {
        providerOptions: {
          anthropic: {
            thinking: { type: "enabled", budgetTokens: 10000 },
          },
        },
      }),
      ...(webSearch && {
        tools: {
          webSearch: anthropic.tools.webSearch_20250305(),
        },
      }),
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
