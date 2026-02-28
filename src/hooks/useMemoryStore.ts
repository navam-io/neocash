"use client";

import { get, set, del, keys } from "idb-keyval";
import type { MemoryRecord } from "@/types";

const MEMORY_PREFIX = "memory:";

function memoryKey(id: string) {
  return `${MEMORY_PREFIX}${id}`;
}

export async function saveMemory(memory: MemoryRecord): Promise<void> {
  await set(memoryKey(memory.id), memory);
}

export async function getMemory(
  id: string,
): Promise<MemoryRecord | undefined> {
  return get<MemoryRecord>(memoryKey(id));
}

export async function deleteMemory(id: string): Promise<void> {
  await del(memoryKey(id));
}

export async function listAllMemories(): Promise<MemoryRecord[]> {
  const allKeys = await keys();
  const memKeys = allKeys.filter(
    (k) => typeof k === "string" && k.startsWith(MEMORY_PREFIX),
  );

  const memories: MemoryRecord[] = [];
  for (const key of memKeys) {
    const mem = await get<MemoryRecord>(key as string);
    if (mem) memories.push(mem);
  }

  return memories.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function listMemoriesByType(
  type: "fact" | "decision",
): Promise<MemoryRecord[]> {
  const all = await listAllMemories();
  return all.filter((m) => m.type === type);
}

export async function findMemoryByKey(
  key: string,
): Promise<MemoryRecord | undefined> {
  const allKeys = await keys();
  const memKeys = allKeys.filter(
    (k) => typeof k === "string" && k.startsWith(MEMORY_PREFIX),
  );

  for (const k of memKeys) {
    const mem = await get<MemoryRecord>(k as string);
    if (mem && mem.key === key) return mem;
  }

  return undefined;
}

export async function updateMemoryValue(
  id: string,
  newValue: string,
  source: MemoryRecord["source"],
  confidence?: number,
): Promise<void> {
  const mem = await getMemory(id);
  if (!mem) return;

  mem.value = newValue;
  mem.source = source;
  mem.updatedAt = Date.now();
  if (confidence !== undefined) mem.confidence = confidence;

  await set(memoryKey(id), mem);
}

export async function clearAllMemories(): Promise<void> {
  const allKeys = await keys();
  const memKeys = allKeys.filter(
    (k) => typeof k === "string" && k.startsWith(MEMORY_PREFIX),
  );
  for (const key of memKeys) await del(key);
}
