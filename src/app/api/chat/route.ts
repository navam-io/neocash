import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { buildSpecialistSystemPrompt, buildMemoryContext, buildToolInstructions } from "@/lib/system-prompt";
import { prepareMessagesForAPI } from "@/lib/message-windowing";
import { allTools, getToolSubset } from "@/lib/tool-schemas";
import { getThinkingConfig } from "@/lib/thinking-budget";
import { classifyQuery } from "@/lib/agent-router";
import { getAgentProfile } from "@/lib/agent-profiles";

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
    const { messages, model, researchMode, webSearch, goalContext, memories } = body;

    // Window messages to stay within context limits
    const { messages: windowedMessages, trimmed } = await prepareMessagesForAPI(messages);

    if (trimmed) {
      console.log("[chat] Message windowing applied — older document content stripped");
    }

    // Extract latest user message for classification and memory matching
    const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === "user");
    const userText = lastUserMsg?.content || lastUserMsg?.parts?.filter((p: { type: string }) => p.type === "text").map((p: { text: string }) => p.text).join("") || "";

    // Classify query → select specialist agent
    const agentId = await classifyQuery(userText, goalContext?.goal?.category);
    const agentProfile = getAgentProfile(agentId);

    // Build system prompt: base (or goal) + specialist extension
    let systemPrompt = buildSpecialistSystemPrompt(agentProfile, goalContext);

    // Inject long-term memory context
    if (memories && memories.length > 0) {
      systemPrompt += buildMemoryContext(memories, userText);
    }

    // Append tool instructions
    systemPrompt += buildToolInstructions(!!goalContext);

    // Append web search instruction so the model knows it can search
    if (webSearch) {
      systemPrompt += `\n\n## Web Search\n\nYou have access to real-time web search. Use it proactively to find current market data, news, stock prices, and other time-sensitive information when relevant to the user's question. Do not claim you lack internet access — you can search the web.`;
    }

    const selectedModel = model || "claude-sonnet-4-6";
    const thinkingConfig = getThinkingConfig(selectedModel, windowedMessages, researchMode);

    // Select tools: specialists get filtered subset, generalist gets all
    const agentTools = agentId === "generalist"
      ? allTools
      : getToolSubset(agentProfile.toolNames);

    const result = streamText({
      model: anthropic(selectedModel),
      system: systemPrompt,
      messages: await convertToModelMessages(windowedMessages),
      stopWhen: stepCountIs(10),
      ...(thinkingConfig && {
        providerOptions: {
          anthropic: {
            thinking: thinkingConfig,
          },
        },
      }),
      tools: {
        ...agentTools,
        ...(webSearch && { webSearch: anthropic.tools.webSearch_20250305() }),
      },
    });

    return result.toUIMessageStreamResponse({ sendSources: true });
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
