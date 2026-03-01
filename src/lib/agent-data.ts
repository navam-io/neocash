import type {
  ChatRecord,
  GoalMeta,
  MemoryRecord,
  SignalRecord,
  DocumentRecord,
  ActionItem,
  Insight,
  DashboardValues,
  GoalStatus,
} from "@/types";

// ─── Snapshot Types ──────────────────────────────

export interface ChatSummary {
  id: string;
  title: string;
  updatedAt: number;
}

export interface GoalRecord {
  id: string;
  title: string;
  goal: GoalMeta;
}

export interface AgentDataSnapshot {
  goals: GoalRecord[];
  memories: MemoryRecord[];
  signals: SignalRecord[];
  documents: DocumentRecord[];
  chats: ChatSummary[];
}

// ─── Diff Types ─────────────────────────────────

export interface DiffOperation<T> {
  created: T[];
  updated: T[];
  deleted: string[]; // IDs
}

export interface AgentDataDiff {
  goals: DiffOperation<GoalRecord>;
  memories: DiffOperation<MemoryRecord>;
  signals: DiffOperation<SignalRecord>;
}

// ─── Snapshot Collection (client-side) ──────────

export async function collectDataSnapshot(): Promise<AgentDataSnapshot> {
  // Dynamic imports to avoid bundling server-side
  const { listGoals, listRegularChats } = await import("@/hooks/useGoalStore");
  const { listAllMemories } = await import("@/hooks/useMemoryStore");
  const { listSignalsForGoal } = await import("@/hooks/useSignalStore");
  const { listDocuments } = await import("@/hooks/useDocumentStore");

  const [goalChats, memories, documents, regularChats] = await Promise.all([
    listGoals(),
    listAllMemories(),
    listDocuments(),
    listRegularChats(),
  ]);

  // Build goal records with signals
  const goals: GoalRecord[] = [];
  for (const chat of goalChats) {
    if (!chat.goal) continue;
    goals.push({
      id: chat.id,
      title: chat.title,
      goal: chat.goal,
    });
  }

  // Collect all signals across goals
  const allSignals: SignalRecord[] = [];
  for (const goal of goals) {
    const signals = await listSignalsForGoal(goal.id);
    allSignals.push(...signals);
  }

  // Chat summaries (title + id only)
  const chats: ChatSummary[] = regularChats.map((c) => ({
    id: c.id,
    title: c.title,
    updatedAt: c.updatedAt,
  }));

  return { goals, memories, signals: allSignals, documents, chats };
}

// ─── Diff Computation (server-side) ─────────────

export function computeDiffs(
  before: AgentDataSnapshot,
  after: AgentDataSnapshot,
): AgentDataDiff {
  return {
    goals: computeGoalDiffs(before.goals, after.goals),
    memories: computeMemoryDiffs(before.memories, after.memories),
    signals: computeSignalDiffs(before.signals, after.signals),
  };
}

function computeGoalDiffs(
  before: GoalRecord[],
  after: GoalRecord[],
): DiffOperation<GoalRecord> {
  const beforeMap = new Map(before.map((g) => [g.id, g]));
  const afterMap = new Map(after.map((g) => [g.id, g]));

  const created: GoalRecord[] = [];
  const updated: GoalRecord[] = [];
  const deleted: string[] = [];

  for (const [id, afterGoal] of afterMap) {
    const beforeGoal = beforeMap.get(id);
    if (!beforeGoal) {
      created.push(afterGoal);
    } else if (JSON.stringify(beforeGoal) !== JSON.stringify(afterGoal)) {
      updated.push(afterGoal);
    }
  }

  for (const id of beforeMap.keys()) {
    if (!afterMap.has(id)) deleted.push(id);
  }

  return { created, updated, deleted };
}

function computeMemoryDiffs(
  before: MemoryRecord[],
  after: MemoryRecord[],
): DiffOperation<MemoryRecord> {
  const beforeMap = new Map(before.map((m) => [m.id, m]));
  const afterMap = new Map(after.map((m) => [m.id, m]));

  const created: MemoryRecord[] = [];
  const updated: MemoryRecord[] = [];
  const deleted: string[] = [];

  for (const [id, afterMem] of afterMap) {
    const beforeMem = beforeMap.get(id);
    if (!beforeMem) {
      created.push(afterMem);
    } else if (JSON.stringify(beforeMem) !== JSON.stringify(afterMem)) {
      updated.push(afterMem);
    }
  }

  for (const id of beforeMap.keys()) {
    if (!afterMap.has(id)) deleted.push(id);
  }

  return { created, updated, deleted };
}

function computeSignalDiffs(
  before: SignalRecord[],
  after: SignalRecord[],
): DiffOperation<SignalRecord> {
  const beforeMap = new Map(before.map((s) => [s.id, s]));
  const afterMap = new Map(after.map((s) => [s.id, s]));

  const created: SignalRecord[] = [];
  const updated: SignalRecord[] = [];
  const deleted: string[] = [];

  for (const [id, afterSig] of afterMap) {
    if (!beforeMap.has(id)) {
      created.push(afterSig);
    }
  }

  for (const id of beforeMap.keys()) {
    if (!afterMap.has(id)) deleted.push(id);
  }

  return { created, updated, deleted };
}

// ─── Diff Application (client-side) ─────────────

export async function applyDiffs(diffs: AgentDataDiff): Promise<void> {
  const { updateDashboardValues, addActionItems, addInsights, updateGoalStatus } =
    await import("@/hooks/useGoalStore");
  const { processExtractedMemories } = await import("@/lib/memory-processing");
  const { processDetectedSignals } = await import("@/lib/signal-processing");
  const { deleteMemory, updateMemoryValue } = await import("@/hooks/useMemoryStore");

  // Apply goal updates (dashboard values, action items, insights, status)
  for (const goal of diffs.goals.updated) {
    if (goal.goal.dashboardValues) {
      await updateDashboardValues(goal.id, goal.goal.dashboardValues);
    }
    if (goal.goal.actionItems?.length) {
      const newItems = goal.goal.actionItems
        .filter((a: ActionItem) => !a.completed)
        .map((a: ActionItem) => ({ text: a.text, priority: a.priority }));
      if (newItems.length > 0) {
        await addActionItems(goal.id, newItems);
      }
    }
    if (goal.goal.insights?.length) {
      const newInsights = goal.goal.insights
        .filter((i: Insight) => !i.dismissedAt)
        .map((i: Insight) => ({ text: i.text, type: i.type }));
      if (newInsights.length > 0) {
        await addInsights(goal.id, newInsights);
      }
    }
    if (goal.goal.status) {
      await updateGoalStatus(goal.id, goal.goal.status as GoalStatus);
    }
  }

  // Apply new memories
  for (const mem of diffs.memories.created) {
    await processExtractedMemories(
      [{
        type: mem.type,
        key: mem.key,
        value: mem.value,
        category: mem.category,
        confidence: mem.confidence,
        context: mem.context,
        keywords: mem.keywords,
      }],
      mem.source.chatId,
      mem.source.messageId,
    );
  }

  // Apply memory updates
  for (const mem of diffs.memories.updated) {
    await updateMemoryValue(
      mem.id,
      mem.value,
      mem.source,
      mem.confidence,
    );
  }

  // Apply memory deletions
  for (const id of diffs.memories.deleted) {
    await deleteMemory(id);
  }

  // Apply new signals
  for (const sig of diffs.signals.created) {
    await processDetectedSignals(
      [{
        goalId: sig.goalId,
        summary: sig.summary,
        category: sig.category,
        extractedValues: sig.extractedValues,
        actionItems: sig.actionItems,
        insights: sig.insights,
      }],
      sig.sourceChatId,
      sig.sourceMessageId,
    );
  }
}
