/**
 * Adaptive thinking budget configuration.
 *
 * Returns the appropriate thinking config based on model capability,
 * research mode, and query complexity.
 */

// Models that support adaptive thinking (budget determined by the model)
const ADAPTIVE_MODELS = new Set([
  "claude-sonnet-4-6",
  "claude-opus-4-6",
]);

// Models that support thinking but need an explicit budget
const THINKING_CAPABLE = new Set([
  ...ADAPTIVE_MODELS,
  "claude-sonnet-4-5-20250514",
  "claude-opus-4-0-20250514",
]);

const ANALYTICAL_KEYWORDS = [
  "analyze", "compare", "plan", "evaluate", "optimize",
  "calculate", "strategy", "tradeoff", "recommend",
  "pros and cons", "step by step",
];

type ThinkingConfig =
  | { type: "adaptive" }
  | { type: "enabled"; budgetTokens: number };

/**
 * Extract the last user message text from a messages array.
 * Handles both string content and parts-based messages.
 */
function getLastUserText(messages: unknown[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i] as Record<string, unknown>;
    if (msg?.role !== "user") continue;

    // String content
    if (typeof msg.content === "string") return msg.content;

    // Parts array
    if (Array.isArray(msg.parts)) {
      return (msg.parts as Array<{ type: string; text?: string }>)
        .filter((p) => p.type === "text" && p.text)
        .map((p) => p.text!)
        .join("");
    }

    // Content array (model message format)
    if (Array.isArray(msg.content)) {
      return (msg.content as Array<{ type: string; text?: string }>)
        .filter((p) => p.type === "text" && p.text)
        .map((p) => p.text!)
        .join("");
    }
  }
  return "";
}

function countAnalyticalKeywords(text: string): number {
  const lower = text.toLowerCase();
  return ANALYTICAL_KEYWORDS.filter((kw) => lower.includes(kw)).length;
}

/**
 * Determine the thinking configuration for a given request.
 *
 * Returns null when thinking should be disabled, or a config object
 * for the streamText providerOptions.
 */
export function getThinkingConfig(
  model: string,
  messages: unknown[],
  researchMode: boolean,
): ThinkingConfig | null {
  if (!researchMode) return null;
  if (!THINKING_CAPABLE.has(model)) return null;
  if (ADAPTIVE_MODELS.has(model)) return { type: "adaptive" };

  // Older thinking-capable models: determine budget by complexity
  const userText = getLastUserText(messages);
  const len = userText.length;
  const keywordCount = countAnalyticalKeywords(userText);

  // High complexity: long message, multiple keywords, or document references
  if (len > 500 || keywordCount >= 2) {
    return { type: "enabled", budgetTokens: 16000 };
  }

  // Medium complexity: moderate length or analytical keywords
  if (len > 100 || keywordCount >= 1) {
    return { type: "enabled", budgetTokens: 8000 };
  }

  // Low complexity: short simple query
  return { type: "enabled", budgetTokens: 2048 };
}
