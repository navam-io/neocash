/**
 * MCP Financial Server — Stdio-based MCP server exposing financial data tools.
 *
 * Backed by a temp JSON file containing an AgentDataSnapshot.
 * Used by the Agent SDK orchestrator to read/write financial data.
 *
 * Usage: npx tsx src/mcp/financial-server.ts /tmp/neocash-agent-xxx.json
 */

import { readFileSync, writeFileSync } from "node:fs";
import { z } from "zod";
import {
  tool as sdkTool,
  createSdkMcpServer,
} from "@anthropic-ai/claude-agent-sdk";
import type { AgentDataSnapshot, GoalRecord } from "@/lib/agent-data";
import type {
  DashboardValues,
  ActionItem,
  Insight,
  MemoryRecord,
  SignalRecord,
} from "@/types";

// ─── Data File Management ───────────────────────

let dataFilePath: string;
let snapshot: AgentDataSnapshot;

export function loadSnapshot(filePath: string): AgentDataSnapshot {
  dataFilePath = filePath;
  const raw = readFileSync(filePath, "utf-8");
  snapshot = JSON.parse(raw) as AgentDataSnapshot;
  return snapshot;
}

function flushSnapshot(): void {
  writeFileSync(dataFilePath, JSON.stringify(snapshot, null, 2), "utf-8");
}

function getGoal(goalId: string): GoalRecord | undefined {
  return snapshot.goals.find((g) => g.id === goalId);
}

// ─── MCP Tool Definitions ───────────────────────

const listGoalsTool = sdkTool(
  "list_goals",
  "List all financial goals with their status and progress.",
  {
    status: z
      .enum(["active", "paused", "completed"])
      .optional()
      .describe("Filter by goal status"),
  },
  async (args) => {
    let goals = snapshot.goals;
    if (args.status) {
      goals = goals.filter((g) => g.goal.status === args.status);
    }
    const result = goals.map((g) => ({
      id: g.id,
      title: g.title,
      status: g.goal.status,
      category: g.goal.category,
      signalCount: g.goal.signalCount,
      actionItemCount: g.goal.actionItems?.length ?? 0,
      pendingActions: g.goal.actionItems?.filter((a) => !a.completed).length ?? 0,
      insightCount: g.goal.insights?.filter((i) => !i.dismissedAt).length ?? 0,
    }));
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  },
);

const getGoalTool = sdkTool(
  "get_goal",
  "Get full details for a specific goal including dashboard metrics, action items, insights, and signals.",
  {
    goalId: z.string().describe("The goal ID to retrieve"),
  },
  async (args) => {
    const goal = getGoal(args.goalId);
    if (!goal) {
      return { content: [{ type: "text" as const, text: JSON.stringify({ error: `Goal ${args.goalId} not found` }) }] };
    }
    const signals = snapshot.signals.filter((s) => s.goalId === args.goalId).slice(0, 10);
    const result = {
      id: goal.id,
      title: goal.title,
      goal: {
        status: goal.goal.status,
        category: goal.goal.category,
        description: goal.goal.description,
        dashboardSchema: goal.goal.dashboardSchema,
        dashboardValues: goal.goal.dashboardValues,
        actionItems: goal.goal.actionItems,
        insights: goal.goal.insights?.filter((i) => !i.dismissedAt),
      },
      signals: signals.map((s) => ({
        id: s.id,
        summary: s.summary,
        category: s.category,
      })),
    };
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  },
);

const listMemoriesTool = sdkTool(
  "list_memories",
  "List the user's stored profile facts and financial decisions.",
  {
    type: z
      .enum(["fact", "decision"])
      .optional()
      .describe("Filter by memory type"),
  },
  async (args) => {
    let memories = snapshot.memories;
    if (args.type) {
      memories = memories.filter((m) => m.type === args.type);
    }
    const result = memories.map((m) => ({
      id: m.id,
      type: m.type,
      key: m.key,
      value: m.value,
      category: m.category,
      confidence: m.confidence,
      context: m.context,
      keywords: m.keywords,
    }));
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  },
);

const listSignalsTool = sdkTool(
  "list_signals",
  "List cross-pollinated signals for a goal.",
  {
    goalId: z.string().describe("The goal ID to list signals for"),
  },
  async (args) => {
    const signals = snapshot.signals.filter((s) => s.goalId === args.goalId);
    const result = signals.map((s) => ({
      id: s.id,
      summary: s.summary,
      category: s.category,
      createdAt: s.createdAt,
      extractedValues: s.extractedValues,
    }));
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  },
);

const listDocumentsTool = sdkTool(
  "list_documents",
  "List uploaded documents and files.",
  {
    chatId: z.string().optional().describe("Filter by chat ID"),
  },
  async (args) => {
    let docs = snapshot.documents;
    if (args.chatId) {
      docs = docs.filter((d) => d.chatId === args.chatId);
    }
    const result = docs.map((d) => ({
      id: d.id,
      filename: d.filename,
      mediaType: d.mediaType,
      metadata: d.metadata,
      fileSize: d.fileSize,
    }));
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  },
);

const listChatsTool = sdkTool(
  "list_chats",
  "List recent conversations (excluding goal threads).",
  {
    limit: z.number().optional().default(10).describe("Maximum chats to return"),
  },
  async (args) => {
    const result = snapshot.chats.slice(0, args.limit).map((c) => ({
      id: c.id,
      title: c.title,
      updatedAt: c.updatedAt,
    }));
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  },
);

// ─── WRITE Tools ────────────────────────────────

const updateDashboardTool = sdkTool(
  "update_dashboard",
  "Update dashboard metric values for a goal.",
  {
    goalId: z.string().describe("The goal ID"),
    values: z
      .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
      .describe("Dashboard values keyed by attribute ID"),
  },
  async (args) => {
    const goal = getGoal(args.goalId);
    if (!goal) {
      return { content: [{ type: "text" as const, text: JSON.stringify({ error: `Goal ${args.goalId} not found` }) }] };
    }
    if (!goal.goal.dashboardValues) {
      goal.goal.dashboardValues = {};
    }
    for (const [key, val] of Object.entries(args.values)) {
      goal.goal.dashboardValues[key] = { value: val, updatedAt: Date.now() };
    }
    flushSnapshot();
    return { content: [{ type: "text" as const, text: JSON.stringify({ updated: true, goalId: args.goalId }) }] };
  },
);

const addInsightsTool = sdkTool(
  "add_insights",
  "Add insights or observations to a goal.",
  {
    goalId: z.string().describe("The goal ID"),
    items: z
      .array(
        z.object({
          text: z.string(),
          type: z.enum(["missing_info", "recommendation", "warning", "opportunity"]),
        }),
      )
      .describe("Insights to add"),
  },
  async (args) => {
    const goal = getGoal(args.goalId);
    if (!goal) {
      return { content: [{ type: "text" as const, text: JSON.stringify({ error: `Goal ${args.goalId} not found` }) }] };
    }
    if (!goal.goal.insights) {
      goal.goal.insights = [];
    }
    const now = Date.now();
    for (const item of args.items) {
      goal.goal.insights.push({
        id: `insight-${now}-${Math.random().toString(36).slice(2, 6)}`,
        text: item.text,
        type: item.type,
        createdAt: now,
      });
    }
    flushSnapshot();
    return { content: [{ type: "text" as const, text: JSON.stringify({ added: args.items.length, goalId: args.goalId }) }] };
  },
);

const addActionItemsTool = sdkTool(
  "add_action_items",
  "Add action items (next steps) to a goal.",
  {
    goalId: z.string().describe("The goal ID"),
    items: z
      .array(
        z.object({
          text: z.string(),
          priority: z.enum(["high", "medium", "low"]),
        }),
      )
      .describe("Action items to add"),
  },
  async (args) => {
    const goal = getGoal(args.goalId);
    if (!goal) {
      return { content: [{ type: "text" as const, text: JSON.stringify({ error: `Goal ${args.goalId} not found` }) }] };
    }
    if (!goal.goal.actionItems) {
      goal.goal.actionItems = [];
    }
    const now = Date.now();
    for (const item of args.items) {
      goal.goal.actionItems.push({
        id: `action-${now}-${Math.random().toString(36).slice(2, 6)}`,
        text: item.text,
        priority: item.priority,
        completed: false,
        createdAt: now,
      });
    }
    flushSnapshot();
    return { content: [{ type: "text" as const, text: JSON.stringify({ added: args.items.length, goalId: args.goalId }) }] };
  },
);

const saveSignalTool = sdkTool(
  "save_signal",
  "Save a cross-pollination signal to a goal.",
  {
    goalId: z.string().describe("The goal ID"),
    summary: z.string().describe("Brief summary of the finding"),
    category: z.string().describe("Signal category"),
    extractedValues: z
      .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
      .optional()
      .describe("Dashboard values to update"),
  },
  async (args) => {
    const now = Date.now();
    const signal: SignalRecord = {
      id: `sig-${now}-${Math.random().toString(36).slice(2, 6)}`,
      goalId: args.goalId,
      sourceChatId: "background-agent",
      sourceMessageId: "background-agent",
      summary: args.summary,
      category: args.category,
      createdAt: now,
      extractedValues: args.extractedValues as Record<string, string | number | boolean> | undefined,
    };
    snapshot.signals.push(signal);

    // Also update dashboard values if provided
    if (args.extractedValues) {
      const goal = getGoal(args.goalId);
      if (goal) {
        if (!goal.goal.dashboardValues) goal.goal.dashboardValues = {};
        for (const [key, val] of Object.entries(args.extractedValues)) {
          goal.goal.dashboardValues[key] = { value: val, updatedAt: now };
        }
      }
    }

    // Increment signal count
    const goal = getGoal(args.goalId);
    if (goal) {
      goal.goal.signalCount = (goal.goal.signalCount || 0) + 1;
    }

    flushSnapshot();
    return { content: [{ type: "text" as const, text: JSON.stringify({ saved: true, goalId: args.goalId }) }] };
  },
);

const saveMemoryTool = sdkTool(
  "save_memory",
  "Save a financial fact or decision to the user's profile.",
  {
    type: z.enum(["fact", "decision"]),
    key: z.string().describe("snake_case identifier"),
    value: z.string().describe("Human-readable value"),
    category: z.enum(["income", "tax", "accounts", "debt", "family", "employment", "property", "goals", "general"]),
    confidence: z.number().min(0).max(1),
    context: z.string().optional(),
    keywords: z.array(z.string()).optional(),
  },
  async (args) => {
    // Check for existing memory with same key (dedup)
    const existing = snapshot.memories.find((m) => m.key === args.key);
    const now = Date.now();

    if (existing) {
      existing.value = args.value;
      existing.confidence = args.confidence;
      existing.updatedAt = now;
      if (args.context) existing.context = args.context;
      if (args.keywords) existing.keywords = args.keywords;
    } else {
      const mem: MemoryRecord = {
        id: `mem-${now}-${Math.random().toString(36).slice(2, 6)}`,
        type: args.type,
        key: args.key,
        value: args.value,
        category: args.category,
        confidence: args.confidence,
        source: {
          chatId: "background-agent",
          messageId: "background-agent",
          extractedAt: now,
        },
        context: args.context,
        keywords: args.keywords,
        createdAt: now,
        updatedAt: now,
      };
      snapshot.memories.push(mem);
    }

    flushSnapshot();
    return { content: [{ type: "text" as const, text: JSON.stringify({ saved: true, key: args.key }) }] };
  },
);

const updateMemoryTool = sdkTool(
  "update_memory",
  "Update the value of an existing memory.",
  {
    memoryId: z.string().describe("The memory ID"),
    newValue: z.string().describe("The new value"),
    confidence: z.number().min(0).max(1).optional(),
  },
  async (args) => {
    const mem = snapshot.memories.find((m) => m.id === args.memoryId);
    if (!mem) {
      return { content: [{ type: "text" as const, text: JSON.stringify({ error: `Memory ${args.memoryId} not found` }) }] };
    }
    mem.value = args.newValue;
    mem.updatedAt = Date.now();
    if (args.confidence !== undefined) mem.confidence = args.confidence;
    flushSnapshot();
    return { content: [{ type: "text" as const, text: JSON.stringify({ updated: true, memoryId: args.memoryId }) }] };
  },
);

const completeActionItemTool = sdkTool(
  "complete_action_item",
  "Mark an action item as completed.",
  {
    goalId: z.string().describe("The goal ID"),
    actionItemId: z.string().describe("The action item ID"),
  },
  async (args) => {
    const goal = getGoal(args.goalId);
    if (!goal) {
      return { content: [{ type: "text" as const, text: JSON.stringify({ error: `Goal ${args.goalId} not found` }) }] };
    }
    const item = goal.goal.actionItems?.find((a) => a.id === args.actionItemId);
    if (!item) {
      return { content: [{ type: "text" as const, text: JSON.stringify({ error: `Action item ${args.actionItemId} not found` }) }] };
    }
    item.completed = true;
    flushSnapshot();
    return { content: [{ type: "text" as const, text: JSON.stringify({ completed: true, goalId: args.goalId }) }] };
  },
);

const updateGoalStatusTool = sdkTool(
  "update_goal_status",
  "Change a goal's status.",
  {
    goalId: z.string().describe("The goal ID"),
    status: z.enum(["active", "paused", "completed"]),
  },
  async (args) => {
    const goal = getGoal(args.goalId);
    if (!goal) {
      return { content: [{ type: "text" as const, text: JSON.stringify({ error: `Goal ${args.goalId} not found` }) }] };
    }
    goal.goal.status = args.status;
    flushSnapshot();
    return { content: [{ type: "text" as const, text: JSON.stringify({ updated: true, goalId: args.goalId, status: args.status }) }] };
  },
);

// ─── All Tools ──────────────────────────────────

export const allMcpTools = [
  listGoalsTool,
  getGoalTool,
  listMemoriesTool,
  listSignalsTool,
  listDocumentsTool,
  listChatsTool,
  updateDashboardTool,
  addInsightsTool,
  addActionItemsTool,
  saveSignalTool,
  saveMemoryTool,
  updateMemoryTool,
  completeActionItemTool,
  updateGoalStatusTool,
];

// ─── Server Factory ─────────────────────────────

export function createFinancialMcpServer(filePath: string) {
  loadSnapshot(filePath);

  return createSdkMcpServer({
    name: "neocash-financial",
    version: "1.0.0",
    tools: allMcpTools,
  });
}

// ─── Tool Names for allowedTools ────────────────

export const MCP_TOOL_PREFIX = "mcp__neocash-financial__";

export const allMcpToolNames = allMcpTools.map(
  (t) => `${MCP_TOOL_PREFIX}${(t as { name: string }).name}`,
);
