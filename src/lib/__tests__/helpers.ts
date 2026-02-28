import type { UIMessage } from "ai";

/**
 * Create a UIMessage with a single text part.
 */
export function makeTextMessage(
  id: string,
  role: "user" | "assistant",
  text: string,
): UIMessage {
  return {
    id,
    role,
    parts: [{ type: "text", text }],
    createdAt: new Date(),
  } as UIMessage;
}

/**
 * Create a UIMessage with a file part (and optional text part).
 */
export function makeFileMessage(
  id: string,
  role: "user" | "assistant",
  opts: {
    mediaType: string;
    filename: string;
    dataUrl: string;
    text?: string;
  },
): UIMessage {
  const parts: UIMessage["parts"] = [];
  if (opts.text) {
    parts.push({ type: "text", text: opts.text });
  }
  parts.push({
    type: "file",
    url: opts.dataUrl,
    mediaType: opts.mediaType,
    filename: opts.filename,
  } as unknown as UIMessage["parts"][number]);
  return {
    id,
    role,
    parts,
    createdAt: new Date(),
  } as UIMessage;
}

/**
 * Generate a string of exactly `n` characters for token budget tests.
 */
export function makeTextOfLength(n: number): string {
  const base = "abcdefghij"; // 10 chars
  const full = Math.floor(n / base.length);
  const remainder = n % base.length;
  return base.repeat(full) + base.slice(0, remainder);
}
