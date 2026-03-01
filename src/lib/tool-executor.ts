"use client";

import { getChat } from "@/hooks/useChatHistory";
import {
  listGoals,
  listRegularChats,
  updateGoalStatus,
  updateDashboardValues,
  addActionItems,
  toggleActionItem,
  addInsights,
  setDashboardSchema,
} from "@/hooks/useGoalStore";
import { listSignalsForGoal } from "@/hooks/useSignalStore";
import {
  listAllMemories,
  listMemoriesByType,
  deleteMemory,
  updateMemoryValue,
} from "@/hooks/useMemoryStore";
import { listDocuments } from "@/hooks/useDocumentStore";
import { processExtractedMemories } from "@/lib/memory-processing";
import { processDetectedSignals } from "@/lib/signal-processing";
import type { ToolName } from "@/lib/tool-schemas";
import type { DashboardValues, GoalStatus } from "@/types";

interface ExecutorContext {
  chatId: string;
  messageId: string;
}

export async function executeToolCall(
  toolName: string,
  input: Record<string, unknown>,
  context: ExecutorContext,
): Promise<unknown> {
  switch (toolName as ToolName) {
    // ─── READ Tools ────────────────────────────

    case "list_goals": {
      const goals = await listGoals();
      const status = input.status as string | undefined;
      const filtered = status
        ? goals.filter((g) => g.goal?.status === status)
        : goals;
      return filtered.map((g) => ({
        id: g.id,
        title: g.title,
        status: g.goal?.status,
        category: g.goal?.category,
        signalCount: g.goal?.signalCount,
        crossPollinate: g.goal?.crossPollinate,
        actionItemCount: g.goal?.actionItems?.length ?? 0,
        pendingActions: g.goal?.actionItems?.filter((a) => !a.completed).length ?? 0,
        insightCount: g.goal?.insights?.filter((i) => !i.dismissedAt).length ?? 0,
      }));
    }

    case "get_goal": {
      const goalId = input.goalId as string;
      const chat = await getChat(goalId);
      if (!chat?.goal) return { error: `Goal ${goalId} not found` };
      const signals = await listSignalsForGoal(goalId);
      return {
        id: chat.id,
        title: chat.title,
        goal: {
          status: chat.goal.status,
          category: chat.goal.category,
          description: chat.goal.description,
          crossPollinate: chat.goal.crossPollinate,
          dashboardSchema: chat.goal.dashboardSchema,
          dashboardValues: chat.goal.dashboardValues,
          actionItems: chat.goal.actionItems,
          insights: chat.goal.insights?.filter((i) => !i.dismissedAt),
        },
        signals: signals.slice(0, 10).map((s) => ({
          id: s.id,
          summary: s.summary,
          category: s.category,
          createdAt: s.createdAt,
        })),
      };
    }

    case "list_signals": {
      const goalId = input.goalId as string;
      const signals = await listSignalsForGoal(goalId);
      return signals.map((s) => ({
        id: s.id,
        summary: s.summary,
        category: s.category,
        createdAt: s.createdAt,
        extractedValues: s.extractedValues,
        actionItems: s.actionItems,
        insights: s.insights,
      }));
    }

    case "list_memories": {
      const type = input.type as "fact" | "decision" | undefined;
      const memories = type
        ? await listMemoriesByType(type)
        : await listAllMemories();
      return memories.map((m) => ({
        id: m.id,
        type: m.type,
        key: m.key,
        value: m.value,
        category: m.category,
        confidence: m.confidence,
        context: m.context,
        keywords: m.keywords,
      }));
    }

    case "list_documents": {
      const docs = await listDocuments();
      const chatId = input.chatId as string | undefined;
      const filtered = chatId
        ? docs.filter((d) => d.chatId === chatId)
        : docs;
      return filtered.map((d) => ({
        id: d.id,
        filename: d.filename,
        mediaType: d.mediaType,
        chatId: d.chatId,
        metadata: d.metadata,
        fileSize: d.fileSize,
        createdAt: d.createdAt,
      }));
    }

    case "list_chats": {
      const limit = (input.limit as number) || 10;
      const chats = await listRegularChats();
      return chats.slice(0, limit).map((c) => ({
        id: c.id,
        title: c.title,
        messageCount: c.messages.length,
        updatedAt: c.updatedAt,
      }));
    }

    // ─── WRITE Tools ───────────────────────────

    case "save_memory": {
      const count = await processExtractedMemories(
        [
          {
            type: input.type as "fact" | "decision",
            key: input.key as string,
            value: input.value as string,
            category: input.category as "income" | "tax" | "accounts" | "debt" | "family" | "employment" | "property" | "goals" | "general",
            confidence: input.confidence as number,
            context: input.context as string | undefined,
            keywords: input.keywords as string[] | undefined,
          },
        ],
        context.chatId,
        context.messageId,
      );
      return { saved: count > 0, key: input.key };
    }

    case "update_memory": {
      await updateMemoryValue(
        input.memoryId as string,
        input.newValue as string,
        { chatId: context.chatId, messageId: context.messageId, extractedAt: Date.now() },
        input.confidence as number | undefined,
      );
      return { updated: true, memoryId: input.memoryId };
    }

    case "delete_memory": {
      await deleteMemory(input.memoryId as string);
      return { deleted: true, memoryId: input.memoryId };
    }

    case "save_signal": {
      const count = await processDetectedSignals(
        [
          {
            goalId: input.goalId as string,
            summary: input.summary as string,
            category: input.category as string,
            extractedValues: input.extractedValues as Record<string, string | number | boolean> | undefined,
            actionItems: input.actionItems as { text: string; priority: "high" | "medium" | "low" }[] | undefined,
            insights: input.insights as { text: string; type: "missing_info" | "recommendation" | "warning" | "opportunity" }[] | undefined,
          },
        ],
        context.chatId,
        context.messageId,
      );
      return { saved: count > 0, goalId: input.goalId };
    }

    case "update_dashboard": {
      const goalId = input.goalId as string;
      const rawValues = input.values as Record<string, string | number | boolean>;
      const dashValues: DashboardValues = {};
      for (const [key, val] of Object.entries(rawValues)) {
        dashValues[key] = {
          value: val,
          updatedAt: Date.now(),
        };
      }
      await updateDashboardValues(goalId, dashValues);
      return { updated: true, goalId };
    }

    case "add_action_items": {
      const goalId = input.goalId as string;
      const items = input.items as { text: string; priority: "high" | "medium" | "low" }[];
      await addActionItems(goalId, items);
      return { added: items.length, goalId };
    }

    case "complete_action_item": {
      const goalId = input.goalId as string;
      const actionItemId = input.actionItemId as string;
      await toggleActionItem(goalId, actionItemId);
      return { completed: true, goalId, actionItemId };
    }

    case "add_insights": {
      const goalId = input.goalId as string;
      const items = input.items as { text: string; type: "missing_info" | "recommendation" | "warning" | "opportunity" }[];
      await addInsights(goalId, items);
      return { added: items.length, goalId };
    }

    case "update_goal_status": {
      const goalId = input.goalId as string;
      const status = input.status as GoalStatus;
      const disableCapture = status !== "active";
      await updateGoalStatus(goalId, status, disableCapture || undefined);
      return { updated: true, goalId, status };
    }

    case "generate_dashboard": {
      const goalId = input.goalId as string;
      const resp = await fetch("/api/generate-dashboard-schema", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: input.title,
          description: input.description,
          category: input.category || undefined,
        }),
      });
      if (!resp.ok) return { error: "Failed to generate dashboard schema" };
      const data = await resp.json();
      const schema = data.schema?.length > 0 ? data.schema : undefined;
      if (schema) {
        await setDashboardSchema(goalId, schema);
        return {
          generated: true,
          goalId,
          attributes: schema.map((a: { id: string; name: string; type: string }) => `${a.name} (${a.type})`),
        };
      }
      return { generated: false, goalId, reason: "No schema attributes generated" };
    }

    case "scan_chats_for_signals": {
      const goalId = input.goalId as string;
      const chats = await listRegularChats();
      const recentChats = chats.slice(0, 10);
      let totalSignals = 0;
      const signalSummaries: string[] = [];

      for (const chat of recentChats) {
        const assistantMessages = chat.messages
          .filter((m: { role: string }) => m.role === "assistant")
          .slice(-3);

        const batchedTexts: { msgId: string; text: string }[] = [];
        for (const msg of assistantMessages) {
          const text =
            msg.parts
              ?.filter(
                (p: { type: string }): p is { type: "text"; text: string } => p.type === "text",
              )
              .map((p: { text: string }) => p.text)
              .join("") || "";
          if (text.length > 50) {
            batchedTexts.push({ msgId: msg.id, text: text.slice(0, 1200) });
          }
        }

        if (batchedTexts.length === 0) continue;

        const combined = batchedTexts.map((t) => t.text).join("\n---\n");
        const resp = await fetch("/api/detect-signals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            responseText: combined.slice(0, 6000),
            goals: [{
              id: goalId,
              title: input.title,
              description: input.description,
              category: (input.category as string) || "",
            }],
          }),
        });

        if (resp.ok) {
          const data = await resp.json();
          if (data.signals?.length > 0) {
            const sourceMessageId = batchedTexts[batchedTexts.length - 1].msgId;
            const count = await processDetectedSignals(data.signals, chat.id, sourceMessageId);
            totalSignals += count;
            for (const s of data.signals) {
              signalSummaries.push(s.summary);
            }
          }
        }
      }

      return {
        scanned: recentChats.length,
        signalsFound: totalSignals,
        summaries: signalSummaries,
      };
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}
