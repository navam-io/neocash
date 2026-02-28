import type { UIMessage } from "ai";

const DEFAULT_TOKEN_BUDGET = 160_000;
const DEFAULT_RECENT_COUNT = 6;
const CHARS_PER_TOKEN = 4;

// Media types the Anthropic API accepts as file content blocks
const SUPPORTED_FILE_TYPES = new Set([
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  // Documents
  "application/pdf",
]);

interface WindowingOptions {
  tokenBudget?: number;
  recentCount?: number;
}

interface WindowingResult {
  messages: UIMessage[];
  trimmed: boolean;
  estimatedTokens: number;
}

/**
 * Estimate token count for a single message.
 * Text parts: ~4 chars/token.
 * File parts: base64 data URL length / 1.33 (base64 overhead) / 4.
 */
function estimateMessageTokens(message: UIMessage): number {
  let chars = 0;
  for (const part of message.parts || []) {
    if (part.type === "text") {
      chars += part.text.length;
    } else if (part.type === "file") {
      // data URLs: "data:<mediaType>;base64,<data>"
      // The base64 data is ~1.33x the original binary size
      const url = (part as { type: "file"; url: string }).url || "";
      const commaIndex = url.indexOf(",");
      const base64Length = commaIndex >= 0 ? url.length - commaIndex - 1 : url.length;
      // base64 chars → binary bytes → approximate "text equivalent" for token counting
      chars += Math.ceil(base64Length * 0.75);
    }
  }
  return Math.ceil(chars / CHARS_PER_TOKEN);
}

/**
 * Replace ALL file parts in a message with text placeholders.
 * Returns a shallow clone with file parts replaced.
 */
function stripFileParts(message: UIMessage): UIMessage {
  const hasFiles = message.parts?.some((p) => p.type === "file");
  if (!hasFiles) return message;

  const newParts = message.parts!.map((part) => {
    if (part.type === "file") {
      const filePart = part as { type: "file"; url: string; mediaType?: string; filename?: string };
      const name = filePart.filename || filePart.mediaType || "document";
      return { type: "text" as const, text: `[Previously uploaded: ${name}]` };
    }
    return part;
  });

  return { ...message, parts: newParts };
}

/**
 * Replace file parts with unsupported media types with text placeholders.
 * Keeps images and PDFs (which the Anthropic API accepts), strips everything else.
 */
function stripUnsupportedFileParts(message: UIMessage): UIMessage {
  const hasUnsupported = message.parts?.some((p) => {
    if (p.type !== "file") return false;
    const filePart = p as { type: "file"; mediaType?: string };
    return !SUPPORTED_FILE_TYPES.has(filePart.mediaType || "");
  });
  if (!hasUnsupported) return message;

  const newParts = message.parts!.map((part) => {
    if (part.type === "file") {
      const filePart = part as { type: "file"; url: string; mediaType?: string; filename?: string };
      if (!SUPPORTED_FILE_TYPES.has(filePart.mediaType || "")) {
        const name = filePart.filename || filePart.mediaType || "document";
        return { type: "text" as const, text: `[Uploaded file: ${name}]` };
      }
    }
    return part;
  });

  return { ...message, parts: newParts };
}

/**
 * Prepare messages for API calls by windowing out old document content.
 *
 * Strategy:
 * 1. Keep the last `recentCount` messages fully intact (file parts preserved).
 * 2. For older messages, replace file parts with text placeholders.
 * 3. If still over budget, drop oldest messages (but keep the first user message).
 */
export function prepareMessagesForAPI(
  messages: UIMessage[],
  options: WindowingOptions = {},
): WindowingResult {
  const budget = options.tokenBudget ?? DEFAULT_TOKEN_BUDGET;
  const recentCount = options.recentCount ?? DEFAULT_RECENT_COUNT;

  if (messages.length === 0) {
    return { messages: [], trimmed: false, estimatedTokens: 0 };
  }

  // Step 0: Strip unsupported file types from ALL messages (DOCX, XLSX, etc.)
  // The Anthropic API only accepts images and PDFs as file content blocks.
  const sanitized = messages.map(stripUnsupportedFileParts);

  // Split into old and recent
  const splitIndex = Math.max(0, sanitized.length - recentCount);
  const oldMessages = sanitized.slice(0, splitIndex);
  const recentMessages = sanitized.slice(splitIndex);

  // Step 1: Strip remaining file parts (images/PDFs) from old messages
  const strippedOld = oldMessages.map(stripFileParts);

  // Calculate total tokens
  let combined = [...strippedOld, ...recentMessages];
  let totalTokens = combined.reduce((sum, m) => sum + estimateMessageTokens(m), 0);
  let trimmed = sanitized.some((m, i) => m !== messages[i]) ||
    strippedOld.some((m, i) => m !== oldMessages[i]);

  // Step 2: If still over budget, drop oldest messages (keep first user message)
  if (totalTokens > budget && combined.length > recentCount) {
    const firstUserIndex = combined.findIndex((m) => m.role === "user");
    const firstUser = firstUserIndex >= 0 ? combined[firstUserIndex] : null;

    // Remove old messages from the front until under budget
    let trimStart = firstUser ? 1 : 0; // keep first user msg at index 0
    const preserved = firstUser ? [stripFileParts(firstUser)] : [];

    while (trimStart < combined.length - recentCount && totalTokens > budget) {
      totalTokens -= estimateMessageTokens(combined[trimStart]);
      trimStart++;
      trimmed = true;
    }

    combined = [
      ...preserved,
      ...combined.slice(trimStart),
    ];
    totalTokens = combined.reduce((sum, m) => sum + estimateMessageTokens(m), 0);
  }

  return {
    messages: combined,
    trimmed,
    estimatedTokens: totalTokens,
  };
}
