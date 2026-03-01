import { tool } from "ai";
import { z } from "zod";

// ─── READ Tools ──────────────────────────────────

export const listGoalsTool = tool({
  description:
    "List all financial goals with their status and progress. Use when the user asks about their goals, wants an overview, or you need to find a specific goal.",
  inputSchema: z.object({
    status: z
      .enum(["active", "paused", "completed"])
      .optional()
      .describe("Filter by goal status"),
  }),
});

export const getGoalTool = tool({
  description:
    "Get full details for a specific goal including dashboard metrics, action items, insights, and signals. Use after list_goals to dive into a particular goal.",
  inputSchema: z.object({
    goalId: z.string().describe("The goal ID to retrieve"),
  }),
});

export const listSignalsTool = tool({
  description:
    "List cross-pollinated signals for a goal. Signals are insights detected from other conversations that relate to this goal.",
  inputSchema: z.object({
    goalId: z.string().describe("The goal ID to list signals for"),
  }),
});

export const listMemoriesTool = tool({
  description:
    "List the user's stored profile facts and financial decisions. Use when you need to check what you already know about the user before asking.",
  inputSchema: z.object({
    type: z
      .enum(["fact", "decision"])
      .optional()
      .describe("Filter by memory type"),
  }),
});

export const listDocumentsTool = tool({
  description:
    "List uploaded documents and files. Use when the user references their uploads or you need to check available documents.",
  inputSchema: z.object({
    chatId: z
      .string()
      .optional()
      .describe("Filter by chat ID"),
  }),
});

export const listChatsTool = tool({
  description:
    "List recent conversations (excluding goal threads). Use when you need context from previous discussions.",
  inputSchema: z.object({
    limit: z
      .number()
      .optional()
      .default(10)
      .describe("Maximum number of chats to return"),
  }),
});

// ─── WRITE Tools ─────────────────────────────────

export const saveMemoryTool = tool({
  description:
    "Save a financial fact or decision to the user's profile. Use when the user shares concrete personal information like income, filing status, account details, or makes a significant financial decision. Do NOT save hypothetical scenarios or general advice.",
  inputSchema: z.object({
    type: z.enum(["fact", "decision"]).describe("fact = stable profile data, decision = financial choice made"),
    key: z.string().describe("snake_case identifier, e.g. 'annual_income', 'filing_status'. Use consistent keys so updates overwrite stale data."),
    value: z.string().describe("Human-readable value, e.g. '$180,000', 'Married Filing Jointly'"),
    category: z.enum(["income", "tax", "accounts", "debt", "family", "employment", "property", "goals", "general"]),
    confidence: z.number().min(0).max(1).describe("How certain: 0.9+ for explicitly stated, 0.7-0.9 for inferred"),
    context: z.string().optional().describe("Decisions only: brief rationale"),
    keywords: z.array(z.string()).optional().describe("Decisions only: related terms for matching"),
  }),
});

export const updateMemoryTool = tool({
  description:
    "Update the value of an existing memory. Use when the user corrects or updates previously stored information.",
  inputSchema: z.object({
    memoryId: z.string().describe("The memory ID to update"),
    newValue: z.string().describe("The new value"),
    confidence: z.number().min(0).max(1).optional().describe("Updated confidence score"),
  }),
});

export const deleteMemoryTool = tool({
  description:
    "Delete an incorrect or outdated memory. Use when the user explicitly says information is wrong or should be removed.",
  inputSchema: z.object({
    memoryId: z.string().describe("The memory ID to delete"),
  }),
});

export const saveSignalTool = tool({
  description:
    "Cross-pollinate a finding to a goal. Use when the current conversation contains information relevant to one of the user's active goals. Includes optional dashboard values, action items, and insights.",
  inputSchema: z.object({
    goalId: z.string().describe("The goal ID to save the signal to"),
    summary: z.string().describe("Brief summary of the relevant finding"),
    category: z.string().describe("Signal category, e.g. 'tax_insight', 'investment_signal', 'budget_update'"),
    extractedValues: z
      .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
      .optional()
      .describe("Dashboard metric values to update, keyed by dashboard attribute ID"),
    actionItems: z
      .array(
        z.object({
          text: z.string(),
          priority: z.enum(["high", "medium", "low"]),
        }),
      )
      .optional()
      .describe("New action items to add to the goal"),
    insights: z
      .array(
        z.object({
          text: z.string(),
          type: z.enum(["missing_info", "recommendation", "warning", "opportunity"]),
        }),
      )
      .optional()
      .describe("New insights to add to the goal"),
  }),
});

export const updateDashboardTool = tool({
  description:
    "Update dashboard metric values for a goal. Use when the user provides specific numbers that map to tracked metrics (e.g. contribution amounts, tax liability, portfolio allocations).",
  inputSchema: z.object({
    goalId: z.string().describe("The goal ID"),
    values: z
      .record(
        z.string(),
        z.object({
          value: z.union([z.string(), z.number(), z.boolean()]),
        }),
      )
      .describe("Dashboard values keyed by attribute ID"),
  }),
});

export const addActionItemsTool = tool({
  description:
    "Add action items (next steps) to a goal. Use when you identify concrete tasks the user should take to advance their goal.",
  inputSchema: z.object({
    goalId: z.string().describe("The goal ID"),
    items: z
      .array(
        z.object({
          text: z.string().describe("Action item description"),
          priority: z.enum(["high", "medium", "low"]),
        }),
      )
      .describe("Action items to add"),
  }),
});

export const completeActionItemTool = tool({
  description:
    "Mark an action item as completed. Use when the user confirms they've done something (e.g. 'I filed Form 8606', 'I moved $7k into the Roth').",
  inputSchema: z.object({
    goalId: z.string().describe("The goal ID"),
    actionItemId: z.string().describe("The action item ID to mark complete"),
  }),
});

export const addInsightsTool = tool({
  description:
    "Add insights or observations to a goal. Use for recommendations, warnings, opportunities, or missing information the user should be aware of.",
  inputSchema: z.object({
    goalId: z.string().describe("The goal ID"),
    items: z
      .array(
        z.object({
          text: z.string().describe("Insight text"),
          type: z.enum(["missing_info", "recommendation", "warning", "opportunity"]),
        }),
      )
      .describe("Insights to add"),
  }),
});

export const updateGoalStatusTool = tool({
  description:
    "Change a goal's status. Use when the user wants to pause, resume, or complete a goal.",
  inputSchema: z.object({
    goalId: z.string().describe("The goal ID"),
    status: z.enum(["active", "paused", "completed"]).describe("New status"),
  }),
});

export const generateDashboardTool = tool({
  description:
    "Generate a dashboard schema for a goal. Call this after creating a goal to set up its tracking metrics, or when a goal thread has no dashboard yet.",
  inputSchema: z.object({
    goalId: z.string().describe("The goal ID to generate a dashboard for"),
    title: z.string().describe("Goal title"),
    description: z.string().describe("Goal description"),
    category: z.string().optional().describe("Goal category"),
  }),
});

export const scanChatsForSignalsTool = tool({
  description:
    "Scan recent conversations for signals relevant to a goal. Call this after creating a goal to find existing data in past chats that relates to the new goal.",
  inputSchema: z.object({
    goalId: z.string().describe("The goal ID to scan signals for"),
    title: z.string().describe("Goal title"),
    description: z.string().describe("Goal description"),
    category: z.string().optional().describe("Goal category"),
  }),
});

// ─── Export all tools ────────────────────────────

export const allTools = {
  list_goals: listGoalsTool,
  get_goal: getGoalTool,
  list_signals: listSignalsTool,
  list_memories: listMemoriesTool,
  list_documents: listDocumentsTool,
  list_chats: listChatsTool,
  save_memory: saveMemoryTool,
  update_memory: updateMemoryTool,
  delete_memory: deleteMemoryTool,
  save_signal: saveSignalTool,
  update_dashboard: updateDashboardTool,
  add_action_items: addActionItemsTool,
  complete_action_item: completeActionItemTool,
  add_insights: addInsightsTool,
  update_goal_status: updateGoalStatusTool,
  generate_dashboard: generateDashboardTool,
  scan_chats_for_signals: scanChatsForSignalsTool,
};

export type ToolName = keyof typeof allTools;

export const WRITE_TOOLS = new Set<ToolName>([
  "save_memory",
  "update_memory",
  "delete_memory",
  "save_signal",
  "update_dashboard",
  "add_action_items",
  "complete_action_item",
  "add_insights",
  "update_goal_status",
  "generate_dashboard",
  "scan_chats_for_signals",
]);

export const MEMORY_TOOLS = new Set<ToolName>([
  "save_memory",
  "update_memory",
  "delete_memory",
]);

export const GOAL_TOOLS = new Set<ToolName>([
  "save_signal",
  "update_dashboard",
  "add_action_items",
  "complete_action_item",
  "add_insights",
  "update_goal_status",
  "generate_dashboard",
  "scan_chats_for_signals",
]);
