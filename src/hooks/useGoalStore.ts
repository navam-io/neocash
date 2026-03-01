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
import { withChatLock } from "@/lib/chat-write-lock";
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

export function updateGoalStatus(
  id: string,
  status: GoalStatus,
  disableCapture?: boolean,
): Promise<void> {
  return withChatLock(id, async () => {
    const chat = await getChat(id);
    if (chat?.goal) {
      chat.goal.status = status;
      if (disableCapture) {
        chat.goal.crossPollinate = false;
      }
      await set(chatKey(id), { ...chat, updatedAt: Date.now() });
    }
  });
}

export function toggleCrossPollination(id: string): Promise<void> {
  return withChatLock(id, async () => {
    const chat = await getChat(id);
    if (chat?.goal) {
      chat.goal.crossPollinate = !chat.goal.crossPollinate;
      await set(chatKey(id), { ...chat, updatedAt: Date.now() });
    }
  });
}

export function incrementGoalSignals(id: string): Promise<void> {
  return withChatLock(id, async () => {
    const chat = await getChat(id);
    if (chat?.goal) {
      chat.goal.signalCount += 1;
      await set(chatKey(id), { ...chat, updatedAt: Date.now() });
    }
  });
}

export function setDashboardSchema(
  id: string,
  schema: DashboardSchema,
): Promise<void> {
  return withChatLock(id, async () => {
    const chat = await getChat(id);
    if (chat?.goal) {
      chat.goal.dashboardSchema = schema;
      await set(chatKey(id), { ...chat, updatedAt: Date.now() });
    }
  });
}

export function updateDashboardValues(
  id: string,
  newValues: DashboardValues,
): Promise<void> {
  return withChatLock(id, async () => {
    const chat = await getChat(id);
    if (chat?.goal) {
      chat.goal.dashboardValues = {
        ...chat.goal.dashboardValues,
        ...newValues,
      };
      await set(chatKey(id), { ...chat, updatedAt: Date.now() });
    }
  });
}

export function updateDashboardAttribute(
  id: string,
  attrId: string,
  updates: Partial<Omit<DashboardAttribute, "id">>,
): Promise<void> {
  return withChatLock(id, async () => {
    const chat = await getChat(id);
    if (chat?.goal?.dashboardSchema) {
      chat.goal.dashboardSchema = chat.goal.dashboardSchema.map((attr) =>
        attr.id === attrId ? { ...attr, ...updates } : attr,
      );
      await set(chatKey(id), { ...chat, updatedAt: Date.now() });
    }
  });
}

export function addActionItems(
  goalId: string,
  items: { text: string; priority: "high" | "medium" | "low"; sourceSignalId?: string }[],
): Promise<void> {
  return withChatLock(goalId, async () => {
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
  });
}

export function toggleActionItem(
  goalId: string,
  itemId: string,
): Promise<void> {
  return withChatLock(goalId, async () => {
    const chat = await getChat(goalId);
    if (!chat?.goal?.actionItems) return;
    chat.goal.actionItems = chat.goal.actionItems.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item,
    );
    await set(chatKey(goalId), { ...chat, updatedAt: Date.now() });
  });
}

export function addInsights(
  goalId: string,
  items: { text: string; type: InsightType; sourceSignalId?: string }[],
): Promise<void> {
  return withChatLock(goalId, async () => {
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
  });
}

export function dismissInsight(
  goalId: string,
  insightId: string,
): Promise<void> {
  return withChatLock(goalId, async () => {
    const chat = await getChat(goalId);
    if (!chat?.goal?.insights) return;
    chat.goal.insights = chat.goal.insights.map((item) =>
      item.id === insightId ? { ...item, dismissedAt: Date.now() } : item,
    );
    await set(chatKey(goalId), { ...chat, updatedAt: Date.now() });
  });
}


