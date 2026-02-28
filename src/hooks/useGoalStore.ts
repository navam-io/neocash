"use client";

import { set } from "idb-keyval";
import { nanoid } from "nanoid";
import {
  getChat,
  createChat,
  deleteChat,
  listChats,
} from "@/hooks/useChatHistory";
import { deleteSignalsForGoal } from "@/hooks/useSignalStore";
import { deleteDocumentsForChat } from "@/hooks/useDocumentStore";
import { processDetectedSignals } from "@/lib/signal-processing";
import type {
  ActionItem,
  ChatRecord,
  DashboardAttribute,
  DashboardSchema,
  DashboardValues,
  GoalMeta,
  GoalStatus,
  Insight,
  InsightType,
} from "@/types";

const CHAT_PREFIX = "chat:";

function chatKey(id: string) {
  return `${CHAT_PREFIX}${id}`;
}

export async function createGoal(
  id: string,
  model: string,
  title: string,
  category?: string,
  description?: string,
  origin?: "custom" | "predefined",
): Promise<ChatRecord> {
  const chat = await createChat(id, model);
  chat.title = title;
  chat.goal = {
    type: "goal",
    description: description || title,
    status: "active",
    category,
    signalCount: 0,
    crossPollinate: true,
    origin: origin || "custom",
  };
  await set(chatKey(id), chat);
  return chat;
}

export async function deleteGoal(id: string): Promise<void> {
  await deleteSignalsForGoal(id);
  await deleteDocumentsForChat(id);
  await deleteChat(id);
}

export async function listGoals(): Promise<ChatRecord[]> {
  const all = await listChats();
  return all
    .filter((c) => c.goal !== undefined)
    .sort((a, b) => {
      // Active first, then by updatedAt
      const statusOrder: Record<string, number> = {
        active: 0,
        paused: 1,
        completed: 2,
      };
      const aOrder = statusOrder[a.goal!.status] ?? 1;
      const bOrder = statusOrder[b.goal!.status] ?? 1;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return b.updatedAt - a.updatedAt;
    });
}

export async function listRegularChats(): Promise<ChatRecord[]> {
  const all = await listChats();
  return all.filter((c) => !c.goal);
}

export async function updateGoalStatus(
  id: string,
  status: GoalStatus,
  disableCapture?: boolean,
): Promise<void> {
  const chat = await getChat(id);
  if (chat?.goal) {
    chat.goal.status = status;
    if (disableCapture) {
      chat.goal.crossPollinate = false;
    }
    await set(chatKey(id), { ...chat, updatedAt: Date.now() });
  }
}

export async function toggleCrossPollination(id: string): Promise<void> {
  const chat = await getChat(id);
  if (chat?.goal) {
    chat.goal.crossPollinate = !chat.goal.crossPollinate;
    await set(chatKey(id), { ...chat, updatedAt: Date.now() });
  }
}

export async function incrementGoalSignals(id: string): Promise<void> {
  const chat = await getChat(id);
  if (chat?.goal) {
    chat.goal.signalCount += 1;
    await set(chatKey(id), { ...chat, updatedAt: Date.now() });
  }
}

export async function setDashboardSchema(
  id: string,
  schema: DashboardSchema,
): Promise<void> {
  const chat = await getChat(id);
  if (chat?.goal) {
    chat.goal.dashboardSchema = schema;
    await set(chatKey(id), { ...chat, updatedAt: Date.now() });
  }
}

export async function updateDashboardValues(
  id: string,
  newValues: DashboardValues,
): Promise<void> {
  const chat = await getChat(id);
  if (chat?.goal) {
    chat.goal.dashboardValues = {
      ...chat.goal.dashboardValues,
      ...newValues,
    };
    await set(chatKey(id), { ...chat, updatedAt: Date.now() });
  }
}

export async function updateDashboardAttribute(
  id: string,
  attrId: string,
  updates: Partial<Omit<DashboardAttribute, "id">>,
): Promise<void> {
  const chat = await getChat(id);
  if (chat?.goal?.dashboardSchema) {
    chat.goal.dashboardSchema = chat.goal.dashboardSchema.map((attr) =>
      attr.id === attrId ? { ...attr, ...updates } : attr,
    );
    await set(chatKey(id), { ...chat, updatedAt: Date.now() });
  }
}

export async function addActionItems(
  goalId: string,
  items: { text: string; priority: "high" | "medium" | "low"; sourceSignalId?: string }[],
): Promise<void> {
  const chat = await getChat(goalId);
  if (!chat?.goal) return;
  const existing = chat.goal.actionItems || [];
  const activeCount = existing.filter((a) => !a.completed).length;
  if (activeCount >= 15) return; // Hard cap: max 15 non-completed action items
  const existingTexts = new Set(existing.map((a) => a.text.toLowerCase()));
  const newItems: ActionItem[] = items
    .filter((item) => !existingTexts.has(item.text.toLowerCase()))
    .slice(0, 15 - activeCount) // Only add up to the cap
    .map((item) => ({
      id: nanoid(10),
      text: item.text,
      completed: false,
      priority: item.priority,
      sourceSignalId: item.sourceSignalId,
      createdAt: Date.now(),
    }));
  if (newItems.length === 0) return;
  chat.goal.actionItems = [...existing, ...newItems];
  await set(chatKey(goalId), { ...chat, updatedAt: Date.now() });
}

export async function toggleActionItem(
  goalId: string,
  itemId: string,
): Promise<void> {
  const chat = await getChat(goalId);
  if (!chat?.goal?.actionItems) return;
  chat.goal.actionItems = chat.goal.actionItems.map((item) =>
    item.id === itemId ? { ...item, completed: !item.completed } : item,
  );
  await set(chatKey(goalId), { ...chat, updatedAt: Date.now() });
}

export async function addInsights(
  goalId: string,
  items: { text: string; type: InsightType; sourceSignalId?: string }[],
): Promise<void> {
  const chat = await getChat(goalId);
  if (!chat?.goal) return;
  const existing = chat.goal.insights || [];
  const activeCount = existing.filter((i) => !i.dismissedAt).length;
  if (activeCount >= 10) return; // Hard cap: max 10 non-dismissed insights
  const existingTexts = new Set(existing.map((i) => i.text.toLowerCase()));
  const newItems: Insight[] = items
    .filter((item) => !existingTexts.has(item.text.toLowerCase()))
    .slice(0, 10 - activeCount) // Only add up to the cap
    .map((item) => ({
      id: nanoid(10),
      text: item.text,
      type: item.type,
      sourceSignalId: item.sourceSignalId,
      createdAt: Date.now(),
    }));
  if (newItems.length === 0) return;
  chat.goal.insights = [...existing, ...newItems];
  await set(chatKey(goalId), { ...chat, updatedAt: Date.now() });
}

export async function dismissInsight(
  goalId: string,
  insightId: string,
): Promise<void> {
  const chat = await getChat(goalId);
  if (!chat?.goal?.insights) return;
  chat.goal.insights = chat.goal.insights.map((item) =>
    item.id === insightId ? { ...item, dismissedAt: Date.now() } : item,
  );
  await set(chatKey(goalId), { ...chat, updatedAt: Date.now() });
}

/**
 * Scan a goal thread's own assistant messages for signals.
 * Useful when a goal thread already has conversation but signals were
 * never extracted (e.g., messages generated before self-detection was added).
 * Best-effort, non-blocking.
 */
export async function scanGoalThreadForSignals(
  goalId: string,
): Promise<number> {
  try {
    const chat = await getChat(goalId);
    if (!chat?.goal || !chat.goal.dashboardSchema?.length) return 0;

    const assistantMessages = chat.messages.filter((m) => m.role === "assistant");
    if (assistantMessages.length === 0) return 0;

    const batchedTexts: { msgId: string; text: string }[] = [];
    for (const msg of assistantMessages) {
      const text =
        msg.parts
          ?.filter(
            (p): p is { type: "text"; text: string } => p.type === "text",
          )
          .map((p) => p.text)
          .join("") || "";
      if (text.length > 50) {
        batchedTexts.push({ msgId: msg.id, text: text.slice(0, 1200) });
      }
    }

    if (batchedTexts.length === 0) return 0;

    const combined = batchedTexts.map((t) => t.text).join("\n---\n");
    const resp = await fetch("/api/detect-signals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        responseText: combined.slice(0, 6000),
        goals: [{
          id: goalId,
          title: chat.title,
          description: chat.goal.description,
          category: chat.goal.category || "",
          dashboardSchema: chat.goal.dashboardSchema,
        }],
      }),
    });

    if (resp.ok) {
      const data = await resp.json();
      if (data.signals?.length > 0) {
        const sourceMessageId = batchedTexts[batchedTexts.length - 1].msgId;
        return processDetectedSignals(data.signals, goalId, sourceMessageId);
      }
    }

    return 0;
  } catch {
    return 0;
  }
}

/**
 * Scan existing regular chats for signals relevant to a newly created goal.
 * Best-effort, non-blocking — intended to be called fire-and-forget.
 * Batches all assistant messages per chat into a single API call.
 */
export async function scanExistingChatsForSignals(
  goalId: string,
  title: string,
  description: string,
  category?: string,
  dashboardSchema?: DashboardSchema,
): Promise<number> {
  try {
    const regularChats = await listRegularChats();
    const recentChats = regularChats.slice(0, 10);
    let totalSignals = 0;

    for (const chat of recentChats) {
      const assistantMessages = chat.messages
        .filter((m) => m.role === "assistant")
        .slice(-3);

      const batchedTexts: { msgId: string; text: string }[] = [];
      for (const msg of assistantMessages) {
        const text =
          msg.parts
            ?.filter(
              (p): p is { type: "text"; text: string } => p.type === "text",
            )
            .map((p) => p.text)
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
            title,
            description,
            category: category || "",
            dashboardSchema,
          }],
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.signals?.length > 0) {
          const sourceMessageId = batchedTexts[batchedTexts.length - 1].msgId;
          const count = await processDetectedSignals(data.signals, chat.id, sourceMessageId);
          totalSignals += count;
        }
      }
    }

    return totalSignals;
  } catch {
    return 0;
  }
}
