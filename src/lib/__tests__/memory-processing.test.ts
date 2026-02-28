import type { MemoryRecord } from "@/types";

// ─── Mock idb-keyval with in-memory Map ──────────
// This lets the real useMemoryStore functions run their logic
// against a Map instead of IndexedDB (which doesn't exist in Node).
const { idbStore } = vi.hoisted(() => ({
  idbStore: new Map<string, unknown>(),
}));

vi.mock("idb-keyval", () => ({
  get: vi.fn(async (key: string) => idbStore.get(key)),
  set: vi.fn(async (key: string, value: unknown) => {
    idbStore.set(key, value);
  }),
  del: vi.fn(async (key: string) => {
    idbStore.delete(key);
  }),
  keys: vi.fn(async () => [...idbStore.keys()]),
}));

vi.mock("nanoid", () => ({
  nanoid: vi.fn(() => `test_${Math.random().toString(36).slice(2, 8)}`),
}));

import { processExtractedMemories, type ExtractedMemory } from "../memory-processing";
import { buildMemoryContext } from "../system-prompt";

beforeEach(() => {
  idbStore.clear();
  vi.clearAllMocks();
});

/** Helper: insert a memory directly into the idb mock */
function seedMemory(mem: MemoryRecord) {
  idbStore.set(`memory:${mem.id}`, mem);
}

/** Helper: read all memories from the idb mock */
function allMemories(): MemoryRecord[] {
  const mems: MemoryRecord[] = [];
  for (const [key, val] of idbStore.entries()) {
    if (typeof key === "string" && key.startsWith("memory:")) {
      mems.push(val as MemoryRecord);
    }
  }
  return mems;
}

// ─── processExtractedMemories ────────────────────

describe("processExtractedMemories", () => {
  it("creates a new fact when none exists", async () => {
    const extracted: ExtractedMemory[] = [
      {
        type: "fact",
        key: "annual_income",
        value: "$180,000",
        category: "income",
        confidence: 0.95,
      },
    ];

    const count = await processExtractedMemories(extracted, "chat1", "msg1");

    expect(count).toBe(1);
    const mems = allMemories();
    expect(mems).toHaveLength(1);
    expect(mems[0].key).toBe("annual_income");
    expect(mems[0].value).toBe("$180,000");
    expect(mems[0].type).toBe("fact");
  });

  it("updates existing fact when key matches but value differs", async () => {
    seedMemory({
      id: "existing1",
      type: "fact",
      key: "annual_income",
      value: "$150,000",
      category: "income",
      confidence: 0.9,
      source: { chatId: "old", messageId: "old", extractedAt: 1000 },
      createdAt: 1000,
      updatedAt: 1000,
    });

    const extracted: ExtractedMemory[] = [
      {
        type: "fact",
        key: "annual_income",
        value: "$180,000",
        category: "income",
        confidence: 0.95,
      },
    ];

    const count = await processExtractedMemories(extracted, "chat2", "msg2");

    expect(count).toBe(1);
    const mems = allMemories();
    expect(mems).toHaveLength(1);
    expect(mems[0].value).toBe("$180,000");
  });

  it("skips when value is unchanged (dedup)", async () => {
    seedMemory({
      id: "existing1",
      type: "fact",
      key: "filing_status",
      value: "Married Filing Jointly",
      category: "tax",
      confidence: 0.95,
      source: { chatId: "old", messageId: "old", extractedAt: 1000 },
      createdAt: 1000,
      updatedAt: 1000,
    });

    const extracted: ExtractedMemory[] = [
      {
        type: "fact",
        key: "filing_status",
        value: "Married Filing Jointly",
        category: "tax",
        confidence: 0.95,
      },
    ];

    const count = await processExtractedMemories(extracted, "chat2", "msg2");
    expect(count).toBe(0);
  });

  it("skips below confidence threshold", async () => {
    const extracted: ExtractedMemory[] = [
      {
        type: "fact",
        key: "annual_income",
        value: "$100,000",
        category: "income",
        confidence: 0.5,
      },
    ];

    const count = await processExtractedMemories(extracted, "chat1", "msg1");
    expect(count).toBe(0);
    expect(allMemories()).toHaveLength(0);
  });

  it("enforces cap with pruning — replaces lowest confidence", async () => {
    for (let i = 0; i < 50; i++) {
      seedMemory({
        id: `f${i}`,
        type: "fact",
        key: `key_${i}`,
        value: `value_${i}`,
        category: "general",
        confidence: 0.75,
        source: { chatId: "old", messageId: "old", extractedAt: 1000 },
        createdAt: 1000,
        updatedAt: 1000 + i,
      });
    }

    const extracted: ExtractedMemory[] = [
      {
        type: "fact",
        key: "new_key",
        value: "new_value",
        category: "income",
        confidence: 0.95,
      },
    ];

    const count = await processExtractedMemories(extracted, "chat1", "msg1");
    expect(count).toBe(1);
    expect(allMemories()).toHaveLength(50); // Cap maintained
  });

  it("refuses to prune when new memory has lower confidence", async () => {
    for (let i = 0; i < 50; i++) {
      seedMemory({
        id: `f${i}`,
        type: "fact",
        key: `key_${i}`,
        value: `value_${i}`,
        category: "general",
        confidence: 0.95,
        source: { chatId: "old", messageId: "old", extractedAt: 1000 },
        createdAt: 1000,
        updatedAt: 1000 + i,
      });
    }

    const extracted: ExtractedMemory[] = [
      {
        type: "fact",
        key: "new_key",
        value: "new_value",
        category: "income",
        confidence: 0.75,
      },
    ];

    const count = await processExtractedMemories(extracted, "chat1", "msg1");
    expect(count).toBe(0);
    expect(allMemories()).toHaveLength(50);
  });

  it("calls refreshMemoryList on changes", async () => {
    const refresh = vi.fn();
    const extracted: ExtractedMemory[] = [
      {
        type: "fact",
        key: "state",
        value: "California",
        category: "tax",
        confidence: 0.9,
      },
    ];

    await processExtractedMemories(extracted, "chat1", "msg1", refresh);
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("does not call refreshMemoryList when no changes", async () => {
    const refresh = vi.fn();
    const extracted: ExtractedMemory[] = [
      {
        type: "fact",
        key: "low_conf",
        value: "maybe",
        category: "general",
        confidence: 0.3,
      },
    ];

    await processExtractedMemories(extracted, "chat1", "msg1", refresh);
    expect(refresh).not.toHaveBeenCalled();
  });
});

// ─── buildMemoryContext ──────────────────────────

describe("buildMemoryContext", () => {
  function makeFact(
    key: string,
    value: string,
    category: MemoryRecord["category"],
  ): MemoryRecord {
    return {
      id: `id_${key}`,
      type: "fact",
      key,
      value,
      category,
      confidence: 0.9,
      source: { chatId: "c1", messageId: "m1", extractedAt: 1000 },
      createdAt: 1000,
      updatedAt: 1000,
    };
  }

  function makeDecision(
    key: string,
    value: string,
    category: MemoryRecord["category"],
    keywords: string[],
    context?: string,
  ): MemoryRecord {
    return {
      id: `id_${key}`,
      type: "decision",
      key,
      value,
      category,
      confidence: 0.9,
      source: { chatId: "c1", messageId: "m1", extractedAt: 1000 },
      context,
      keywords,
      createdAt: 1000,
      updatedAt: 1000,
    };
  }

  it("returns empty string when no memories", () => {
    expect(buildMemoryContext([])).toBe("");
  });

  it("groups facts by category", () => {
    const memories = [
      makeFact("annual_income", "$180,000", "income"),
      makeFact("filing_status", "MFJ", "tax"),
      makeFact("employer", "Tech Corp", "employment"),
    ];

    const result = buildMemoryContext(memories);
    expect(result).toContain("**Income:**");
    expect(result).toContain("$180,000");
    expect(result).toContain("**Tax:**");
    expect(result).toContain("MFJ");
    expect(result).toContain("**Employment:**");
    expect(result).toContain("Tech Corp");
  });

  it("follows category display order", () => {
    const memories = [
      makeFact("employer", "Tech Corp", "employment"),
      makeFact("annual_income", "$180,000", "income"),
      makeFact("filing_status", "MFJ", "tax"),
    ];

    const result = buildMemoryContext(memories);
    const incomePos = result.indexOf("**Income:**");
    const employmentPos = result.indexOf("**Employment:**");
    const taxPos = result.indexOf("**Tax:**");

    expect(incomePos).toBeLessThan(employmentPos);
    expect(incomePos).toBeLessThan(taxPos);
  });

  it("keyword-matches decisions against user message", () => {
    const memories = [
      makeDecision(
        "chose_roth",
        "Chose Roth IRA over Traditional",
        "accounts",
        ["roth", "ira", "retirement"],
        "Lower tax bracket now",
      ),
      makeDecision(
        "chose_529",
        "Started 529 plan for kids",
        "family",
        ["529", "education", "college"],
      ),
    ];

    const result = buildMemoryContext(memories, "Should I contribute more to my Roth IRA?");
    expect(result).toContain("Chose Roth IRA over Traditional");
  });

  it("limits to top 5 matched decisions", () => {
    const decisions = Array.from({ length: 10 }, (_, i) =>
      makeDecision(`decision_${i}`, `Decision ${i}`, "general", [
        "finance",
        "money",
      ]),
    );

    const result = buildMemoryContext(decisions, "Help with my finance and money");
    const matches = (result.match(/Decision \d/g) || []).length;
    expect(matches).toBeLessThanOrEqual(5);
  });

  it("case-insensitive matching", () => {
    const memories = [
      makeDecision("chose_roth", "Chose Roth IRA", "accounts", [
        "roth",
        "ira",
      ]),
    ];

    const result = buildMemoryContext(memories, "ROTH IRA contribution limits");
    expect(result).toContain("Chose Roth IRA");
  });

  it("includes context for decisions when present", () => {
    const memories = [
      makeDecision(
        "chose_roth",
        "Chose Roth IRA",
        "accounts",
        ["roth"],
        "Lower tax bracket now",
      ),
    ];

    const result = buildMemoryContext(memories, "Tell me about Roth");
    expect(result).toContain("(Lower tax bracket now)");
  });

  it("includes instruction to use profile data directly", () => {
    const memories = [makeFact("income", "$100k", "income")];
    const result = buildMemoryContext(memories);
    expect(result).toContain("Integrate this profile data into your advice");
  });

  it("falls back to most recent 5 decisions when no user message", () => {
    const decisions = Array.from({ length: 8 }, (_, i) =>
      makeDecision(`d_${i}`, `Decision ${i}`, "general", ["kw"]),
    );

    const result = buildMemoryContext(decisions);
    const matches = (result.match(/Decision \d/g) || []).length;
    expect(matches).toBe(5);
  });
});
