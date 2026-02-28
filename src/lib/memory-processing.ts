import { nanoid } from "nanoid";
import {
  saveMemory,
  findMemoryByKey,
  updateMemoryValue,
  listMemoriesByType,
  deleteMemory,
} from "@/hooks/useMemoryStore";
import type { MemoryType, MemoryCategory, MemoryRecord } from "@/types";

const CONFIDENCE_THRESHOLD = 0.7;
const FACT_CAP = 50;
const DECISION_CAP = 20;

export interface ExtractedMemory {
  type: MemoryType;
  key: string;
  value: string;
  category: MemoryCategory;
  confidence: number;
  context?: string;
  keywords?: string[];
}

/**
 * Process extracted memories from the extract-memories API.
 * Handles deduplication by key, confidence filtering, and cap enforcement.
 * Returns the number of memories created or updated.
 */
export async function processExtractedMemories(
  extracted: ExtractedMemory[],
  sourceChatId: string,
  sourceMessageId: string,
  refreshMemoryList?: () => void,
): Promise<number> {
  let count = 0;

  for (const mem of extracted) {
    // Skip low-confidence extractions
    if (mem.confidence < CONFIDENCE_THRESHOLD) continue;

    const source: MemoryRecord["source"] = {
      chatId: sourceChatId,
      messageId: sourceMessageId,
      extractedAt: Date.now(),
    };

    // Deduplication: check if a memory with this key already exists
    const existing = await findMemoryByKey(mem.key);

    if (existing) {
      // Same value → skip (no-op dedup)
      if (existing.value === mem.value) continue;

      // Value changed → update in place
      await updateMemoryValue(existing.id, mem.value, source, mem.confidence);
      count++;
      continue;
    }

    // New memory: check cap and prune if needed
    const cap = mem.type === "fact" ? FACT_CAP : DECISION_CAP;
    const existing_of_type = await listMemoriesByType(mem.type);

    if (existing_of_type.length >= cap) {
      // Find lowest-confidence, oldest memory to prune
      const sorted = [...existing_of_type].sort((a, b) => {
        if (a.confidence !== b.confidence) return a.confidence - b.confidence;
        return a.updatedAt - b.updatedAt; // older first
      });
      const weakest = sorted[0];

      // Only prune if new memory has higher confidence
      if (mem.confidence <= weakest.confidence) continue;
      await deleteMemory(weakest.id);
    }

    // Save new memory
    const now = Date.now();
    await saveMemory({
      id: nanoid(10),
      type: mem.type,
      key: mem.key,
      value: mem.value,
      category: mem.category,
      confidence: mem.confidence,
      source,
      context: mem.context,
      keywords: mem.keywords,
      createdAt: now,
      updatedAt: now,
    });

    count++;
  }

  if (count > 0 && refreshMemoryList) {
    refreshMemoryList();
  }

  return count;
}
