import { vi } from "vitest";
import { writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AgentDataSnapshot } from "@/lib/agent-data";

// Mock the Agent SDK's createSdkMcpServer since we only test tool logic
vi.mock("@anthropic-ai/claude-agent-sdk", () => ({
  createSdkMcpServer: vi.fn(() => ({ name: "neocash-financial" })),
  tool: vi.fn(
    (name: string, desc: string, schema: unknown, handler: Function) => ({
      name,
      description: desc,
      schema,
      handler,
    }),
  ),
}));

import { loadSnapshot, allMcpTools, MCP_TOOL_PREFIX, allMcpToolNames } from "../financial-server";

// ─── Test Data ──────────────────────────────────

function makeSampleSnapshot(): AgentDataSnapshot {
  return {
    goals: [
      {
        id: "g1",
        title: "Tax Optimization",
        goal: {
          type: "goal",
          description: "Reduce tax liability",
          status: "active",
          category: "tax",
          signalCount: 2,
          crossPollinate: true,
          dashboardSchema: [
            { id: "effective_rate", name: "Effective Rate", type: "percent" },
          ],
          dashboardValues: {
            effective_rate: { value: 22, updatedAt: 1000 },
          },
          actionItems: [
            { id: "a1", text: "File extension", completed: false, priority: "high", createdAt: 1000 },
          ],
          insights: [
            { id: "i1", text: "Consider Roth conversion", type: "recommendation", createdAt: 1000 },
          ],
        },
      },
      {
        id: "g2",
        title: "Retirement",
        goal: {
          type: "goal",
          description: "Retire by 55",
          status: "active",
          signalCount: 0,
          crossPollinate: true,
        },
      },
    ],
    memories: [
      {
        id: "m1",
        type: "fact",
        key: "annual_income",
        value: "$180,000",
        category: "income",
        confidence: 0.95,
        source: { chatId: "c1", messageId: "msg1", extractedAt: 1000 },
        createdAt: 1000,
        updatedAt: 1000,
      },
      {
        id: "m2",
        type: "decision",
        key: "roth_conversion",
        value: "Proceeding with Roth conversion for 2024",
        category: "tax",
        confidence: 0.9,
        source: { chatId: "c1", messageId: "msg2", extractedAt: 2000 },
        context: "After reviewing tax brackets",
        keywords: ["roth", "conversion", "ira"],
        createdAt: 2000,
        updatedAt: 2000,
      },
    ],
    signals: [
      {
        id: "s1",
        goalId: "g1",
        sourceChatId: "c2",
        sourceMessageId: "msg3",
        summary: "Tax-loss harvesting opportunity found",
        category: "tax_insight",
        createdAt: 3000,
      },
    ],
    documents: [
      {
        id: "d1",
        filename: "W2-2024.pdf",
        mediaType: "application/pdf",
        chatId: "c1",
        metadata: "W2 for 2024 tax year",
        fileSize: 50000,
        createdAt: 1000,
      },
    ],
    chats: [
      { id: "c1", title: "Tax discussion", updatedAt: 5000 },
      { id: "c2", title: "Investment review", updatedAt: 4000 },
    ],
  };
}

// ─── Helper to run a tool handler ───────────────

async function runTool(
  toolName: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  const tool = allMcpTools.find(
    (t) => (t as { name: string }).name === toolName,
  ) as { handler: (args: Record<string, unknown>) => Promise<{ content: { text: string }[] }> } | undefined;
  if (!tool) throw new Error(`Tool ${toolName} not found`);
  const result = await tool.handler(args);
  return JSON.parse(result.content[0].text);
}

// ─── Tests ──────────────────────────────────────

describe("financial-server", () => {
  let tempFile: string;

  beforeEach(() => {
    tempFile = join(tmpdir(), `test-financial-${Date.now()}.json`);
    const snapshot = makeSampleSnapshot();
    writeFileSync(tempFile, JSON.stringify(snapshot), "utf-8");
    loadSnapshot(tempFile);
  });

  describe("tool metadata", () => {
    it("defines 14 MCP tools", () => {
      expect(allMcpTools).toHaveLength(14);
    });

    it("all tool names are prefixed correctly", () => {
      for (const name of allMcpToolNames) {
        expect(name.startsWith(MCP_TOOL_PREFIX)).toBe(true);
      }
    });

    it("has unique tool names", () => {
      const names = allMcpTools.map((t) => (t as { name: string }).name);
      expect(new Set(names).size).toBe(names.length);
    });
  });

  describe("READ tools", () => {
    it("list_goals returns all goals", async () => {
      const result = (await runTool("list_goals", {})) as Array<{ id: string }>;
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("g1");
    });

    it("list_goals filters by status", async () => {
      const result = (await runTool("list_goals", {
        status: "completed",
      })) as Array<unknown>;
      expect(result).toHaveLength(0);
    });

    it("get_goal returns goal with signals", async () => {
      const result = (await runTool("get_goal", {
        goalId: "g1",
      })) as Record<string, unknown>;
      expect(result.id).toBe("g1");
      expect(result.title).toBe("Tax Optimization");
      expect((result.signals as Array<unknown>)).toHaveLength(1);
    });

    it("get_goal returns error for missing goal", async () => {
      const result = (await runTool("get_goal", {
        goalId: "missing",
      })) as Record<string, unknown>;
      expect(result.error).toBeDefined();
    });

    it("list_memories returns all memories", async () => {
      const result = (await runTool("list_memories", {})) as Array<{ id: string }>;
      expect(result).toHaveLength(2);
    });

    it("list_memories filters by type", async () => {
      const result = (await runTool("list_memories", {
        type: "fact",
      })) as Array<unknown>;
      expect(result).toHaveLength(1);
    });

    it("list_signals returns signals for goal", async () => {
      const result = (await runTool("list_signals", {
        goalId: "g1",
      })) as Array<unknown>;
      expect(result).toHaveLength(1);
    });

    it("list_documents returns all documents", async () => {
      const result = (await runTool("list_documents", {})) as Array<{ id: string }>;
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("d1");
    });

    it("list_chats returns chat summaries", async () => {
      const result = (await runTool("list_chats", {})) as Array<{ id: string }>;
      expect(result).toHaveLength(2);
    });
  });

  describe("WRITE tools", () => {
    it("update_dashboard updates goal values", async () => {
      await runTool("update_dashboard", {
        goalId: "g1",
        values: { effective_rate: 18, deductions_found: 5 },
      });

      // Verify by reading back
      const goal = (await runTool("get_goal", { goalId: "g1" })) as {
        goal: { dashboardValues: Record<string, { value: unknown }> };
      };
      expect(goal.goal.dashboardValues.effective_rate.value).toBe(18);
      expect(goal.goal.dashboardValues.deductions_found.value).toBe(5);
    });

    it("update_dashboard persists to file", async () => {
      await runTool("update_dashboard", {
        goalId: "g1",
        values: { effective_rate: 15 },
      });

      const raw = readFileSync(tempFile, "utf-8");
      const data = JSON.parse(raw) as AgentDataSnapshot;
      expect(data.goals[0].goal.dashboardValues?.effective_rate.value).toBe(15);
    });

    it("add_insights adds to goal", async () => {
      await runTool("add_insights", {
        goalId: "g1",
        items: [
          { text: "HSA optimization available", type: "opportunity" },
        ],
      });

      const goal = (await runTool("get_goal", { goalId: "g1" })) as {
        goal: { insights: Array<{ text: string }> };
      };
      // Original had 1 insight, now should have 2
      expect(goal.goal.insights).toHaveLength(2);
    });

    it("add_action_items adds to goal", async () => {
      const result = (await runTool("add_action_items", {
        goalId: "g1",
        items: [
          { text: "Review 401k allocation", priority: "medium" },
        ],
      })) as { added: number };

      expect(result.added).toBe(1);
    });

    it("save_signal creates signal and increments count", async () => {
      const result = (await runTool("save_signal", {
        goalId: "g1",
        summary: "New tax insight",
        category: "tax_insight",
      })) as { saved: boolean };

      expect(result.saved).toBe(true);

      const goals = (await runTool("list_goals", {})) as Array<{
        id: string;
        signalCount: number;
      }>;
      const g1 = goals.find((g) => g.id === "g1")!;
      expect(g1.signalCount).toBe(3); // was 2, now 3 (we added a mock signalCount in goal definition)
    });

    it("save_memory creates new memory", async () => {
      await runTool("save_memory", {
        type: "fact",
        key: "filing_status",
        value: "Married Filing Jointly",
        category: "tax",
        confidence: 0.95,
      });

      const mems = (await runTool("list_memories", {})) as Array<{ key: string }>;
      expect(mems.length).toBe(3);
      expect(mems.find((m) => m.key === "filing_status")).toBeDefined();
    });

    it("save_memory deduplicates by key", async () => {
      await runTool("save_memory", {
        type: "fact",
        key: "annual_income",
        value: "$200,000",
        category: "income",
        confidence: 0.95,
      });

      const mems = (await runTool("list_memories", {})) as Array<{ key: string; value: string }>;
      // Should still be 2, not 3 (dedup by key)
      expect(mems.length).toBe(2);
      const income = mems.find((m) => m.key === "annual_income")!;
      expect(income.value).toBe("$200,000");
    });

    it("update_memory updates existing memory", async () => {
      const result = (await runTool("update_memory", {
        memoryId: "m1",
        newValue: "$220,000",
        confidence: 0.98,
      })) as { updated: boolean };

      expect(result.updated).toBe(true);

      const mems = (await runTool("list_memories", { type: "fact" })) as Array<{
        id: string;
        value: string;
      }>;
      const m1 = mems.find((m) => m.id === "m1")!;
      expect(m1.value).toBe("$220,000");
    });

    it("complete_action_item marks item complete", async () => {
      const result = (await runTool("complete_action_item", {
        goalId: "g1",
        actionItemId: "a1",
      })) as { completed: boolean };

      expect(result.completed).toBe(true);
    });

    it("update_goal_status changes status", async () => {
      await runTool("update_goal_status", {
        goalId: "g1",
        status: "paused",
      });

      const goals = (await runTool("list_goals", {})) as Array<{
        id: string;
        status: string;
      }>;
      const g1 = goals.find((g) => g.id === "g1")!;
      expect(g1.status).toBe("paused");
    });
  });

  describe("data integrity", () => {
    it("maintains consistency after multiple write operations", async () => {
      // Update dashboard
      await runTool("update_dashboard", {
        goalId: "g1",
        values: { effective_rate: 20 },
      });

      // Add insight
      await runTool("add_insights", {
        goalId: "g1",
        items: [{ text: "Test insight", type: "recommendation" }],
      });

      // Save signal
      await runTool("save_signal", {
        goalId: "g1",
        summary: "Cross-pollinated finding",
        category: "general",
      });

      // Save memory
      await runTool("save_memory", {
        type: "fact",
        key: "test_key",
        value: "test_value",
        category: "general",
        confidence: 0.8,
      });

      // Verify all data persisted correctly
      const raw = readFileSync(tempFile, "utf-8");
      const data = JSON.parse(raw) as AgentDataSnapshot;

      expect(data.goals[0].goal.dashboardValues?.effective_rate.value).toBe(20);
      expect(data.goals[0].goal.insights?.length).toBe(2);
      expect(data.signals.length).toBe(2);
      expect(data.memories.length).toBe(3);
    });
  });
});
