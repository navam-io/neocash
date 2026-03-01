import { getThinkingConfig } from "../thinking-budget";
import { makeTextMessage, makeTextOfLength } from "./helpers";

describe("getThinkingConfig", () => {
  // ─── Disabled scenarios ─────────────────────────

  it("returns null when researchMode is false", () => {
    const msgs = [makeTextMessage("1", "user", "analyze my portfolio")];
    expect(getThinkingConfig("claude-sonnet-4-6", msgs, false)).toBeNull();
  });

  it("returns null for Haiku (not thinking-capable)", () => {
    const msgs = [makeTextMessage("1", "user", "analyze my portfolio")];
    expect(getThinkingConfig("claude-haiku-4-5-20251001", msgs, true)).toBeNull();
  });

  it("returns null for unknown model IDs", () => {
    const msgs = [makeTextMessage("1", "user", "hello")];
    expect(getThinkingConfig("some-unknown-model", msgs, true)).toBeNull();
  });

  // ─── Adaptive models ───────────────────────────

  it("returns adaptive for Sonnet 4.6", () => {
    const msgs = [makeTextMessage("1", "user", "hello")];
    expect(getThinkingConfig("claude-sonnet-4-6", msgs, true)).toEqual({
      type: "adaptive",
    });
  });

  it("returns adaptive for Opus 4.6", () => {
    const msgs = [makeTextMessage("1", "user", "hello")];
    expect(getThinkingConfig("claude-opus-4-6", msgs, true)).toEqual({
      type: "adaptive",
    });
  });

  // ─── Older models: complexity tiers ────────────

  it("returns low budget for short simple queries on older models", () => {
    const msgs = [makeTextMessage("1", "user", "What is a 401k?")];
    const result = getThinkingConfig("claude-sonnet-4-5-20250514", msgs, true);
    expect(result).toEqual({ type: "enabled", budgetTokens: 2048 });
  });

  it("returns medium budget for queries with analytical keywords", () => {
    const msgs = [makeTextMessage("1", "user", "analyze my tax situation")];
    const result = getThinkingConfig("claude-sonnet-4-5-20250514", msgs, true);
    expect(result).toEqual({ type: "enabled", budgetTokens: 8000 });
  });

  it("returns medium budget for moderate-length queries (>100 chars)", () => {
    const text = makeTextOfLength(150);
    const msgs = [makeTextMessage("1", "user", text)];
    const result = getThinkingConfig("claude-opus-4-0-20250514", msgs, true);
    expect(result).toEqual({ type: "enabled", budgetTokens: 8000 });
  });

  it("returns high budget for long queries (>500 chars)", () => {
    const text = makeTextOfLength(600);
    const msgs = [makeTextMessage("1", "user", text)];
    const result = getThinkingConfig("claude-sonnet-4-5-20250514", msgs, true);
    expect(result).toEqual({ type: "enabled", budgetTokens: 16000 });
  });

  it("returns high budget for queries with multiple analytical keywords", () => {
    const msgs = [
      makeTextMessage("1", "user", "compare and evaluate my options"),
    ];
    const result = getThinkingConfig("claude-sonnet-4-5-20250514", msgs, true);
    expect(result).toEqual({ type: "enabled", budgetTokens: 16000 });
  });

  // ─── Edge cases ────────────────────────────────

  it("handles empty messages array", () => {
    const result = getThinkingConfig("claude-sonnet-4-5-20250514", [], true);
    // No user text → short simple query → low budget
    expect(result).toEqual({ type: "enabled", budgetTokens: 2048 });
  });

  it("handles messages with no text content", () => {
    const msgs = [{ role: "assistant", parts: [{ type: "text", text: "Hello" }] }];
    // No user message → empty text → low budget
    const result = getThinkingConfig("claude-sonnet-4-5-20250514", msgs, true);
    expect(result).toEqual({ type: "enabled", budgetTokens: 2048 });
  });

  it("extracts text from the last user message, not earlier ones", () => {
    const msgs = [
      makeTextMessage("1", "user", "compare and evaluate everything"),
      makeTextMessage("2", "assistant", "Here is my analysis..."),
      makeTextMessage("3", "user", "thanks"),
    ];
    // "thanks" is short and simple → low budget
    const result = getThinkingConfig("claude-sonnet-4-5-20250514", msgs, true);
    expect(result).toEqual({ type: "enabled", budgetTokens: 2048 });
  });
});
