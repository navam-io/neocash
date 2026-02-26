"use client";

import { get, set } from "idb-keyval";
import { nanoid } from "nanoid";
import {
  getChat,
  createChat,
  listChats,
} from "@/hooks/useChatHistory";
import { saveSignal } from "@/hooks/useSignalStore";
import type { ChatRecord, GoalMeta, GoalStatus } from "@/types";

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
): Promise<number> {
  try {
    const regularChats = await listRegularChats();
    const recentChats = regularChats.slice(0, 10);
    let totalSignals = 0;

    for (const chat of recentChats) {
      const assistantMessages = chat.messages
        .filter((m) => m.role === "assistant")
        .slice(-3);

      // Batch: concatenate all qualifying messages for this chat
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

      // Single API call per chat with all messages concatenated
      const combined = batchedTexts.map((t) => t.text).join("\n---\n");
      const resp = await fetch("/api/detect-signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responseText: combined.slice(0, 4000),
          goals: [{ id: goalId, title, description, category: category || "" }],
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.signals && data.signals.length > 0) {
          // Use the last message ID as source for all signals from this chat
          const sourceMessageId = batchedTexts[batchedTexts.length - 1].msgId;
          for (const sig of data.signals) {
            await saveSignal({
              id: nanoid(10),
              goalId: sig.goalId,
              sourceChatId: chat.id,
              sourceMessageId,
              summary: sig.summary,
              category: sig.category,
              createdAt: Date.now(),
            });
            await incrementGoalSignals(sig.goalId);
            totalSignals++;
          }
        }
      }
    }

    return totalSignals;
  } catch {
    // Best-effort — don't break goal creation if scanning fails
    return 0;
  }
}
