import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages } from "ai";
import { SYSTEM_PROMPT, buildGoalSystemPrompt } from "@/lib/system-prompt";
import { prepareMessagesForAPI } from "@/lib/message-windowing";

export const maxDuration = 60;

function isContextOverflowError(error: unknown): boolean {
  const msg = String(error).toLowerCase();
  return (
    msg.includes("too many tokens") ||
    msg.includes("token limit") ||
    msg.includes("context length") ||
    msg.includes("overloaded") ||
    msg.includes("request too large")
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, model, researchMode, webSearch, goalContext } = body;

    // Window messages to stay within context limits
    const { messages: windowedMessages, trimmed } = await prepareMessagesForAPI(messages);

    if (trimmed) {
      console.log("[chat] Message windowing applied — older document content stripped");
    }

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
      messages: await convertToModelMessages(windowedMessages),
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

    if (isContextOverflowError(error)) {
      return new Response(
        JSON.stringify({
          error: "This conversation exceeds the context limit. Older document content has been summarized, but the conversation is still too long.",
          code: "CONTEXT_OVERFLOW",
        }),
        { status: 413, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
