"use client";

import { get, set, del, keys, entries } from "idb-keyval";
import type { ChatRecord } from "@/types";

const CHAT_PREFIX = "chat:";

function chatKey(id: string) {
  return `${CHAT_PREFIX}${id}`;
}

export async function getChat(id: string): Promise<ChatRecord | undefined> {
  return get<ChatRecord>(chatKey(id));
}

export async function saveChat(chat: ChatRecord): Promise<void> {
  await set(chatKey(chat.id), { ...chat, updatedAt: Date.now() });
}

export async function deleteChat(id: string): Promise<void> {
  await del(chatKey(id));
}

export async function listChats(): Promise<ChatRecord[]> {
  const allKeys = await keys();
  const chatKeys = allKeys.filter(
    (k) => typeof k === "string" && k.startsWith(CHAT_PREFIX),
  );

  if (chatKeys.length === 0) return [];

  const allEntries = await entries();
  const chats = allEntries
    .filter(([k]) => typeof k === "string" && k.startsWith(CHAT_PREFIX))
    .map(([, v]) => v as ChatRecord)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return chats;
}

export async function createChat(
  id: string,
  model: string,
): Promise<ChatRecord> {
  const chat: ChatRecord = {
    id,
    title: "",
    messages: [],
    model,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await set(chatKey(id), chat);
  return chat;
}
