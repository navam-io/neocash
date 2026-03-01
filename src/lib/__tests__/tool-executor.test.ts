import { vi } from "vitest";

// Hoist all mock fns so vi.mock factories can reference them
const {
  mockListGoals,
  mockListRegularChats,
  mockGetChat,
  mockUpdateGoalStatus,
  mockUpdateDashboardValues,
  mockAddActionItems,
  mockToggleActionItem,
  mockAddInsights,
  mockListSignalsForGoal,
  mockListAllMemories,
  mockListMemoriesByType,
  mockDeleteMemory,
  mockUpdateMemoryValue,
  mockListDocuments,
  mockProcessExtractedMemories,
  mockProcessDetectedSignals,
  mockSetDashboardSchema,
} = vi.hoisted(() => ({
  mockListGoals: vi.fn(),
  mockListRegularChats: vi.fn(),
  mockGetChat: vi.fn(),
  mockUpdateGoalStatus: vi.fn(),
  mockUpdateDashboardValues: vi.fn(),
  mockAddActionItems: vi.fn(),
  mockToggleActionItem: vi.fn(),
  mockAddInsights: vi.fn(),
  mockListSignalsForGoal: vi.fn(),
  mockListAllMemories: vi.fn(),
  mockListMemoriesByType: vi.fn(),
  mockDeleteMemory: vi.fn(),
  mockUpdateMemoryValue: vi.fn(),
  mockListDocuments: vi.fn(),
  mockProcessExtractedMemories: vi.fn(),
  mockProcessDetectedSignals: vi.fn(),
  mockSetDashboardSchema: vi.fn(),
}));

vi.mock("../../hooks/useGoalStore", () => ({
  listGoals: mockListGoals,
  listRegularChats: mockListRegularChats,
  updateGoalStatus: mockUpdateGoalStatus,
  updateDashboardValues: mockUpdateDashboardValues,
  addActionItems: mockAddActionItems,
  toggleActionItem: mockToggleActionItem,
  addInsights: mockAddInsights,
  setDashboardSchema: mockSetDashboardSchema,
}));

vi.mock("../../hooks/useSignalStore", () => ({
  listSignalsForGoal: mockListSignalsForGoal,
}));

vi.mock("../../hooks/useMemoryStore", () => ({
  listAllMemories: mockListAllMemories,
  listMemoriesByType: mockListMemoriesByType,
  deleteMemory: mockDeleteMemory,
  updateMemoryValue: mockUpdateMemoryValue,
}));

vi.mock("../../hooks/useDocumentStore", () => ({
  listDocuments: mockListDocuments,
}));

vi.mock("../../hooks/useChatHistory", () => ({
  getChat: mockGetChat,
}));

vi.mock("../memory-processing", () => ({
  processExtractedMemories: mockProcessExtractedMemories,
}));

vi.mock("../signal-processing", () => ({
  processDetectedSignals: mockProcessDetectedSignals,
}));

import { executeToolCall } from "../tool-executor";

const ctx = { chatId: "chat-1", messageId: "msg-1" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("tool-executor", () => {
  describe("list_goals", () => {
    it("returns mapped goal summaries", async () => {
      mockListGoals.mockResolvedValue([
        {
          id: "g1",
          title: "Retirement",
          goal: {
            status: "active",
            category: "investing",
            signalCount: 3,
            crossPollinate: true,
            actionItems: [
              { id: "a1", text: "Open IRA", completed: false },
              { id: "a2", text: "Done", completed: true },
            ],
            insights: [{ id: "i1", text: "Tip", dismissedAt: undefined }],
          },
        },
      ]);

      const result = await executeToolCall("list_goals", {}, ctx);
      expect(result).toEqual([
        {
          id: "g1",
          title: "Retirement",
          status: "active",
          category: "investing",
          signalCount: 3,
          crossPollinate: true,
          actionItemCount: 2,
          pendingActions: 1,
          insightCount: 1,
        },
      ]);
    });

    it("filters by status when provided", async () => {
      mockListGoals.mockResolvedValue([
        { id: "g1", title: "A", goal: { status: "active" } },
        { id: "g2", title: "B", goal: { status: "completed" } },
      ]);

      const result = (await executeToolCall("list_goals", { status: "active" }, ctx)) as Array<{ id: string }>;
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("g1");
    });
  });

  describe("get_goal", () => {
    it("returns goal details with signals", async () => {
      mockGetChat.mockResolvedValue({
        id: "g1",
        title: "Tax Goal",
        goal: {
          status: "active",
          category: "tax",
          description: "Reduce taxes",
          crossPollinate: true,
          dashboardSchema: [],
          dashboardValues: {},
          actionItems: [],
          insights: [],
        },
      });
      mockListSignalsForGoal.mockResolvedValue([
        { id: "s1", summary: "Found deduction", category: "tax_insight", createdAt: 100 },
      ]);

      const result = await executeToolCall("get_goal", { goalId: "g1" }, ctx) as Record<string, unknown>;
      expect(result.id).toBe("g1");
      expect(result.title).toBe("Tax Goal");
      expect((result.signals as Array<unknown>)).toHaveLength(1);
    });

    it("returns error for missing goal", async () => {
      mockGetChat.mockResolvedValue(undefined);
      const result = await executeToolCall("get_goal", { goalId: "missing" }, ctx) as Record<string, unknown>;
      expect(result.error).toContain("not found");
    });
  });

  describe("list_memories", () => {
    it("returns all memories without filter", async () => {
      mockListAllMemories.mockResolvedValue([
        { id: "m1", type: "fact", key: "income", value: "$100k", category: "income", confidence: 0.9 },
      ]);

      const result = (await executeToolCall("list_memories", {}, ctx)) as Array<Record<string, unknown>>;
      expect(result).toHaveLength(1);
      expect(result[0].key).toBe("income");
      expect(mockListAllMemories).toHaveBeenCalled();
    });

    it("filters by type when provided", async () => {
      mockListMemoriesByType.mockResolvedValue([]);
      await executeToolCall("list_memories", { type: "decision" }, ctx);
      expect(mockListMemoriesByType).toHaveBeenCalledWith("decision");
    });
  });

  describe("save_memory", () => {
    it("delegates to processExtractedMemories", async () => {
      mockProcessExtractedMemories.mockResolvedValue(1);

      const result = await executeToolCall("save_memory", {
        type: "fact",
        key: "annual_income",
        value: "$180,000",
        category: "income",
        confidence: 0.95,
      }, ctx) as Record<string, unknown>;

      expect(mockProcessExtractedMemories).toHaveBeenCalledWith(
        [expect.objectContaining({ key: "annual_income", value: "$180,000" })],
        "chat-1",
        "msg-1",
      );
      expect(result.saved).toBe(true);
    });
  });

  describe("update_memory", () => {
    it("delegates to updateMemoryValue", async () => {
      await executeToolCall("update_memory", {
        memoryId: "m1",
        newValue: "$200,000",
        confidence: 0.95,
      }, ctx);

      expect(mockUpdateMemoryValue).toHaveBeenCalledWith(
        "m1",
        "$200,000",
        expect.objectContaining({ chatId: "chat-1" }),
        0.95,
      );
    });
  });

  describe("delete_memory", () => {
    it("delegates to deleteMemory", async () => {
      await executeToolCall("delete_memory", { memoryId: "m1" }, ctx);
      expect(mockDeleteMemory).toHaveBeenCalledWith("m1");
    });
  });

  describe("save_signal", () => {
    it("delegates to processDetectedSignals", async () => {
      mockProcessDetectedSignals.mockResolvedValue(1);

      const result = await executeToolCall("save_signal", {
        goalId: "g1",
        summary: "Found relevant tax info",
        category: "tax_insight",
      }, ctx) as Record<string, unknown>;

      expect(mockProcessDetectedSignals).toHaveBeenCalledWith(
        [expect.objectContaining({ goalId: "g1", summary: "Found relevant tax info" })],
        "chat-1",
        "msg-1",
      );
      expect(result.saved).toBe(true);
    });
  });

  describe("update_dashboard", () => {
    it("converts values and delegates to updateDashboardValues", async () => {
      await executeToolCall("update_dashboard", {
        goalId: "g1",
        values: { contrib_2024: { value: 7000 } },
      }, ctx);

      expect(mockUpdateDashboardValues).toHaveBeenCalledWith(
        "g1",
        expect.objectContaining({
          contrib_2024: expect.objectContaining({ value: 7000 }),
        }),
      );
    });
  });

  describe("complete_action_item", () => {
    it("delegates to toggleActionItem", async () => {
      await executeToolCall("complete_action_item", {
        goalId: "g1",
        actionItemId: "a1",
      }, ctx);

      expect(mockToggleActionItem).toHaveBeenCalledWith("g1", "a1");
    });
  });

  describe("update_goal_status", () => {
    it("delegates to updateGoalStatus", async () => {
      await executeToolCall("update_goal_status", {
        goalId: "g1",
        status: "completed",
      }, ctx);

      expect(mockUpdateGoalStatus).toHaveBeenCalledWith("g1", "completed", true);
    });

    it("does not disable capture for active status", async () => {
      await executeToolCall("update_goal_status", {
        goalId: "g1",
        status: "active",
      }, ctx);

      expect(mockUpdateGoalStatus).toHaveBeenCalledWith("g1", "active", undefined);
    });
  });

  describe("generate_dashboard", () => {
    it("calls API and saves schema on success", async () => {
      const mockSchema = [
        { id: "total_income", name: "Total Income", type: "currency" },
        { id: "tax_rate", name: "Tax Rate", type: "percent" },
      ];
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ schema: mockSchema }),
      });

      const result = await executeToolCall("generate_dashboard", {
        goalId: "g1",
        title: "Tax Goal",
        description: "Reduce taxes",
        category: "tax",
      }, ctx) as Record<string, unknown>;

      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/generate-dashboard-schema",
        expect.objectContaining({ method: "POST" }),
      );
      expect(mockSetDashboardSchema).toHaveBeenCalledWith("g1", mockSchema);
      expect(result.generated).toBe(true);
      expect(result.attributes).toHaveLength(2);
    });

    it("returns error on API failure", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false });

      const result = await executeToolCall("generate_dashboard", {
        goalId: "g1",
        title: "Tax Goal",
        description: "Reduce taxes",
      }, ctx) as Record<string, unknown>;

      expect(result.error).toContain("Failed");
      expect(mockSetDashboardSchema).not.toHaveBeenCalled();
    });

    it("handles empty schema response", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ schema: [] }),
      });

      const result = await executeToolCall("generate_dashboard", {
        goalId: "g1",
        title: "Tax Goal",
        description: "Reduce taxes",
      }, ctx) as Record<string, unknown>;

      expect(result.generated).toBe(false);
      expect(mockSetDashboardSchema).not.toHaveBeenCalled();
    });
  });

  describe("scan_chats_for_signals", () => {
    it("scans recent chats and returns signal summary", async () => {
      mockListRegularChats.mockResolvedValue([
        {
          id: "chat-a",
          messages: [
            {
              id: "m1",
              role: "assistant",
              parts: [{ type: "text", text: "You should consider tax-loss harvesting on your portfolio." }],
            },
          ],
        },
      ]);
      mockProcessDetectedSignals.mockResolvedValue(1);

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          signals: [{ goalId: "g1", summary: "Tax-loss harvesting opportunity", category: "tax_insight" }],
        }),
      });

      const result = await executeToolCall("scan_chats_for_signals", {
        goalId: "g1",
        title: "Tax Goal",
        description: "Reduce taxes",
        category: "tax",
      }, ctx) as Record<string, unknown>;

      expect(result.scanned).toBe(1);
      expect(result.signalsFound).toBe(1);
      expect((result.summaries as string[])).toContain("Tax-loss harvesting opportunity");
    });

    it("handles no chats gracefully", async () => {
      mockListRegularChats.mockResolvedValue([]);

      const result = await executeToolCall("scan_chats_for_signals", {
        goalId: "g1",
        title: "Tax Goal",
        description: "Reduce taxes",
      }, ctx) as Record<string, unknown>;

      expect(result.scanned).toBe(0);
      expect(result.signalsFound).toBe(0);
    });

    it("skips chats with only short assistant messages", async () => {
      mockListRegularChats.mockResolvedValue([
        {
          id: "chat-a",
          messages: [
            { id: "m1", role: "assistant", parts: [{ type: "text", text: "Hi" }] },
          ],
        },
      ]);

      const result = await executeToolCall("scan_chats_for_signals", {
        goalId: "g1",
        title: "Tax Goal",
        description: "Reduce taxes",
      }, ctx) as Record<string, unknown>;

      expect(result.scanned).toBe(1);
      expect(result.signalsFound).toBe(0);
      // fetch should NOT have been called since text was too short
    });
  });

  describe("unknown tool", () => {
    it("returns error for unknown tool name", async () => {
      const result = await executeToolCall("unknown_tool", {}, ctx) as Record<string, unknown>;
      expect(result.error).toContain("Unknown tool");
    });
  });
});
