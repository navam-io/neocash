import { makeTextMessage, makeFileMessage, makeTextOfLength } from "./helpers";

const { mockExtractFileText } = vi.hoisted(() => ({
  mockExtractFileText: vi.fn(),
}));

vi.mock("../document-extraction", () => ({
  extractFileText: mockExtractFileText,
  CONVERTIBLE_MIME_TYPES: new Set([
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ]),
}));

import { prepareMessagesForAPI } from "../message-windowing";

beforeEach(() => {
  vi.clearAllMocks();
  mockExtractFileText.mockResolvedValue({
    success: true,
    text: "Extracted document text.",
    truncated: false,
  });
});

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

describe("prepareMessagesForAPI", () => {
  it("returns empty result for empty array", async () => {
    const result = await prepareMessagesForAPI([]);
    expect(result.messages).toEqual([]);
    expect(result.trimmed).toBe(false);
    expect(result.estimatedTokens).toBe(0);
  });

  it("passes through a single text message unchanged", async () => {
    const msgs = [makeTextMessage("1", "user", "Hello")];
    const result = await prepareMessagesForAPI(msgs);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].parts[0]).toEqual({ type: "text", text: "Hello" });
  });

  it("preserves all messages when under budget", async () => {
    const msgs = [
      makeTextMessage("1", "user", "Hi"),
      makeTextMessage("2", "assistant", "Hello"),
      makeTextMessage("3", "user", "Thanks"),
    ];
    const result = await prepareMessagesForAPI(msgs);
    expect(result.messages).toHaveLength(3);
  });

  it("keeps file parts in recent messages (default recentCount=6)", async () => {
    const msgs = [
      makeFileMessage("1", "user", {
        mediaType: "image/png",
        filename: "chart.png",
        dataUrl: "data:image/png;base64,abc123",
      }),
    ];
    const result = await prepareMessagesForAPI(msgs);
    // Single message is within recentCount, file part should remain
    const fileParts = result.messages[0].parts.filter(
      (p: { type: string }) => p.type === "file",
    );
    expect(fileParts).toHaveLength(1);
  });

  it("replaces file parts in old messages with placeholder text", async () => {
    // Create 8 messages — first 2 will be "old" (outside recentCount=6)
    const msgs = [
      makeFileMessage("1", "user", {
        mediaType: "image/png",
        filename: "old-chart.png",
        dataUrl: "data:image/png;base64,abc",
      }),
      makeTextMessage("2", "assistant", "Here is the analysis."),
      ...Array.from({ length: 6 }, (_, i) =>
        makeTextMessage(String(i + 3), i % 2 === 0 ? "user" : "assistant", `Msg ${i}`),
      ),
    ];

    const result = await prepareMessagesForAPI(msgs);
    const firstMsgParts = result.messages[0].parts;
    const textParts = firstMsgParts.filter((p: { type: string }) => p.type === "text");
    expect(textParts.some((p: { text: string }) => p.text.includes("[Previously uploaded:"))).toBe(
      true,
    );
  });

  it("preserves text parts in old messages", async () => {
    const msgs = [
      makeTextMessage("1", "user", "Important context"),
      ...Array.from({ length: 6 }, (_, i) =>
        makeTextMessage(String(i + 2), i % 2 === 0 ? "user" : "assistant", `Msg ${i}`),
      ),
    ];

    const result = await prepareMessagesForAPI(msgs);
    expect(result.messages[0].parts[0]).toEqual({
      type: "text",
      text: "Important context",
    });
  });

  it("converts DOCX file to extracted text with header/footer", async () => {
    const msgs = [
      makeFileMessage("1", "user", {
        mediaType: DOCX_MIME,
        filename: "report.docx",
        dataUrl: "data:" + DOCX_MIME + ";base64,ZmFrZQ==",
      }),
    ];

    const result = await prepareMessagesForAPI(msgs);
    const textPart = result.messages[0].parts.find(
      (p: { type: string; text?: string }) =>
        p.type === "text" && (p.text || "").includes("--- Content from"),
    );
    expect(textPart).toBeDefined();
    expect((textPart as { text: string }).text).toContain("--- Content from report.docx ---");
    expect((textPart as { text: string }).text).toContain("--- End of report.docx ---");
  });

  it("converts XLSX file to extracted text", async () => {
    const msgs = [
      makeFileMessage("1", "user", {
        mediaType: XLSX_MIME,
        filename: "data.xlsx",
        dataUrl: "data:" + XLSX_MIME + ";base64,ZmFrZQ==",
      }),
    ];

    const result = await prepareMessagesForAPI(msgs);
    const textPart = result.messages[0].parts.find(
      (p: { type: string; text?: string }) =>
        p.type === "text" && (p.text || "").includes("--- Content from"),
    );
    expect(textPart).toBeDefined();
  });

  it("handles extraction failure with error message", async () => {
    mockExtractFileText.mockResolvedValue({
      success: false,
      text: "",
      truncated: false,
      error: "Corrupt file",
    });

    const msgs = [
      makeFileMessage("1", "user", {
        mediaType: DOCX_MIME,
        filename: "bad.docx",
        dataUrl: "data:" + DOCX_MIME + ";base64,ZmFrZQ==",
      }),
    ];

    const result = await prepareMessagesForAPI(msgs);
    const textPart = result.messages[0].parts.find(
      (p: { type: string; text?: string }) =>
        p.type === "text" && (p.text || "").includes("Corrupt file"),
    );
    expect(textPart).toBeDefined();
  });

  it("passes images and PDFs through in recent messages", async () => {
    const msgs = [
      makeFileMessage("1", "user", {
        mediaType: "image/jpeg",
        filename: "photo.jpg",
        dataUrl: "data:image/jpeg;base64,abc",
      }),
      makeFileMessage("2", "user", {
        mediaType: "application/pdf",
        filename: "doc.pdf",
        dataUrl: "data:application/pdf;base64,def",
      }),
    ];

    const result = await prepareMessagesForAPI(msgs);
    const allParts = result.messages.flatMap((m) => m.parts);
    const fileParts = allParts.filter((p: { type: string }) => p.type === "file");
    expect(fileParts).toHaveLength(2);
  });

  it("drops oldest messages when over token budget", async () => {
    // 4 chars per token, so 100 tokens = 400 chars
    const msgs = [
      makeTextMessage("1", "user", makeTextOfLength(200)),
      makeTextMessage("2", "assistant", makeTextOfLength(200)),
      makeTextMessage("3", "user", makeTextOfLength(200)),
    ];

    // Budget of 100 tokens = 400 chars, each message ~50 tokens
    const result = await prepareMessagesForAPI(msgs, {
      tokenBudget: 100,
      recentCount: 1,
    });
    expect(result.messages.length).toBeLessThan(3);
    expect(result.trimmed).toBe(true);
  });

  it("preserves first user message when trimming", async () => {
    const msgs = [
      makeTextMessage("1", "user", "First important question"),
      makeTextMessage("2", "assistant", makeTextOfLength(400)),
      makeTextMessage("3", "user", makeTextOfLength(400)),
      makeTextMessage("4", "assistant", "Final answer"),
    ];

    const result = await prepareMessagesForAPI(msgs, {
      tokenBudget: 150,
      recentCount: 1,
    });
    // First user message should be preserved
    const firstMsg = result.messages[0];
    expect(firstMsg.role).toBe("user");
    expect(firstMsg.parts[0]).toEqual({
      type: "text",
      text: "First important question",
    });
  });

  it("returns trimmed: true when messages were modified", async () => {
    const msgs = [
      makeFileMessage("1", "user", {
        mediaType: DOCX_MIME,
        filename: "doc.docx",
        dataUrl: "data:" + DOCX_MIME + ";base64,ZmFrZQ==",
      }),
    ];

    const result = await prepareMessagesForAPI(msgs);
    expect(result.trimmed).toBe(true);
  });

  it("returns trimmed: false when nothing changed", async () => {
    const msgs = [
      makeTextMessage("1", "user", "Hello"),
      makeTextMessage("2", "assistant", "Hi there"),
    ];

    const result = await prepareMessagesForAPI(msgs);
    expect(result.trimmed).toBe(false);
  });

  it("respects custom tokenBudget option", async () => {
    const msgs = [
      makeTextMessage("1", "user", makeTextOfLength(1000)),
      makeTextMessage("2", "assistant", makeTextOfLength(1000)),
    ];

    const smallBudget = await prepareMessagesForAPI(msgs, { tokenBudget: 100, recentCount: 0 });
    const largeBudget = await prepareMessagesForAPI(msgs, { tokenBudget: 1_000_000 });

    expect(smallBudget.messages.length).toBeLessThanOrEqual(largeBudget.messages.length);
  });

  it("respects custom recentCount option", async () => {
    // 4 messages, recentCount=2 means first 2 are old
    const msgs = [
      makeFileMessage("1", "user", {
        mediaType: "image/png",
        filename: "a.png",
        dataUrl: "data:image/png;base64,abc",
      }),
      makeFileMessage("2", "user", {
        mediaType: "image/png",
        filename: "b.png",
        dataUrl: "data:image/png;base64,def",
      }),
      makeTextMessage("3", "user", "Recent text"),
      makeTextMessage("4", "assistant", "Recent reply"),
    ];

    const result = await prepareMessagesForAPI(msgs, { recentCount: 2 });

    // First two messages (old) should have file parts stripped
    const msg1Parts = result.messages[0].parts;
    const hasFile1 = msg1Parts.some((p: { type: string }) => p.type === "file");
    expect(hasFile1).toBe(false);

    const msg2Parts = result.messages[1].parts;
    const hasFile2 = msg2Parts.some((p: { type: string }) => p.type === "file");
    expect(hasFile2).toBe(false);
  });
});
