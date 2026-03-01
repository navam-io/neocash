import { computeDiffs, type AgentDataSnapshot, type GoalRecord } from "../agent-data";
import type { MemoryRecord, SignalRecord } from "@/types";

// ─── Helpers ────────────────────────────────────

function makeGoal(id: string, overrides?: Partial<GoalRecord>): GoalRecord {
  return {
    id,
    title: `Goal ${id}`,
    goal: {
      type: "goal",
      description: `Description for ${id}`,
      status: "active",
      signalCount: 0,
      crossPollinate: true,
      ...(overrides?.goal ?? {}),
    },
    ...overrides,
  };
}

function makeMemory(id: string, overrides?: Partial<MemoryRecord>): MemoryRecord {
  return {
    id,
    type: "fact",
    key: `key_${id}`,
    value: `value_${id}`,
    category: "general",
    confidence: 0.9,
    source: { chatId: "c1", messageId: "m1", extractedAt: 1000 },
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

function makeSignal(id: string, goalId: string): SignalRecord {
  return {
    id,
    goalId,
    sourceChatId: "c1",
    sourceMessageId: "m1",
    summary: `Signal ${id}`,
    category: "test",
    createdAt: 1000,
  };
}

function makeSnapshot(overrides?: Partial<AgentDataSnapshot>): AgentDataSnapshot {
  return {
    goals: [],
    memories: [],
    signals: [],
    documents: [],
    chats: [],
    ...overrides,
  };
}

// ─── Tests ──────────────────────────────────────

describe("agent-data", () => {
  describe("computeDiffs", () => {
    describe("goal diffs", () => {
      it("detects created goals", () => {
        const before = makeSnapshot();
        const after = makeSnapshot({ goals: [makeGoal("g1")] });

        const diffs = computeDiffs(before, after);
        expect(diffs.goals.created).toHaveLength(1);
        expect(diffs.goals.created[0].id).toBe("g1");
        expect(diffs.goals.updated).toHaveLength(0);
        expect(diffs.goals.deleted).toHaveLength(0);
      });

      it("detects updated goals", () => {
        const goal = makeGoal("g1");
        const updatedGoal = makeGoal("g1", {
          goal: { ...goal.goal, status: "completed" },
        });

        const before = makeSnapshot({ goals: [goal] });
        const after = makeSnapshot({ goals: [updatedGoal] });

        const diffs = computeDiffs(before, after);
        expect(diffs.goals.created).toHaveLength(0);
        expect(diffs.goals.updated).toHaveLength(1);
        expect(diffs.goals.updated[0].goal.status).toBe("completed");
        expect(diffs.goals.deleted).toHaveLength(0);
      });

      it("detects deleted goals", () => {
        const before = makeSnapshot({ goals: [makeGoal("g1")] });
        const after = makeSnapshot();

        const diffs = computeDiffs(before, after);
        expect(diffs.goals.created).toHaveLength(0);
        expect(diffs.goals.updated).toHaveLength(0);
        expect(diffs.goals.deleted).toEqual(["g1"]);
      });

      it("detects no changes when goals are identical", () => {
        const goal = makeGoal("g1");
        const before = makeSnapshot({ goals: [goal] });
        const after = makeSnapshot({ goals: [{ ...goal }] });

        const diffs = computeDiffs(before, after);
        expect(diffs.goals.created).toHaveLength(0);
        expect(diffs.goals.updated).toHaveLength(0);
        expect(diffs.goals.deleted).toHaveLength(0);
      });
    });

    describe("memory diffs", () => {
      it("detects created memories", () => {
        const before = makeSnapshot();
        const after = makeSnapshot({ memories: [makeMemory("m1")] });

        const diffs = computeDiffs(before, after);
        expect(diffs.memories.created).toHaveLength(1);
        expect(diffs.memories.created[0].id).toBe("m1");
      });

      it("detects updated memories", () => {
        const mem = makeMemory("m1");
        const updated = makeMemory("m1", { value: "new_value" });

        const before = makeSnapshot({ memories: [mem] });
        const after = makeSnapshot({ memories: [updated] });

        const diffs = computeDiffs(before, after);
        expect(diffs.memories.updated).toHaveLength(1);
        expect(diffs.memories.updated[0].value).toBe("new_value");
      });

      it("detects deleted memories", () => {
        const before = makeSnapshot({ memories: [makeMemory("m1")] });
        const after = makeSnapshot();

        const diffs = computeDiffs(before, after);
        expect(diffs.memories.deleted).toEqual(["m1"]);
      });
    });

    describe("signal diffs", () => {
      it("detects created signals", () => {
        const before = makeSnapshot();
        const after = makeSnapshot({
          signals: [makeSignal("s1", "g1")],
        });

        const diffs = computeDiffs(before, after);
        expect(diffs.signals.created).toHaveLength(1);
        expect(diffs.signals.created[0].id).toBe("s1");
      });

      it("detects deleted signals", () => {
        const before = makeSnapshot({
          signals: [makeSignal("s1", "g1")],
        });
        const after = makeSnapshot();

        const diffs = computeDiffs(before, after);
        expect(diffs.signals.deleted).toEqual(["s1"]);
      });

      it("handles no changes", () => {
        const sig = makeSignal("s1", "g1");
        const before = makeSnapshot({ signals: [sig] });
        const after = makeSnapshot({ signals: [{ ...sig }] });

        const diffs = computeDiffs(before, after);
        expect(diffs.signals.created).toHaveLength(0);
        expect(diffs.signals.deleted).toHaveLength(0);
      });
    });

    describe("complex scenarios", () => {
      it("handles multiple simultaneous changes across stores", () => {
        const before = makeSnapshot({
          goals: [makeGoal("g1"), makeGoal("g2")],
          memories: [makeMemory("m1"), makeMemory("m2")],
          signals: [makeSignal("s1", "g1")],
        });

        const after = makeSnapshot({
          goals: [
            makeGoal("g1", { goal: { ...makeGoal("g1").goal, status: "completed" } }),
            // g2 deleted
            makeGoal("g3"), // g3 created
          ],
          memories: [
            makeMemory("m1", { value: "updated" }), // m1 updated
            // m2 deleted
            makeMemory("m3"), // m3 created
          ],
          signals: [
            // s1 deleted
            makeSignal("s2", "g1"), // s2 created
            makeSignal("s3", "g3"), // s3 created
          ],
        });

        const diffs = computeDiffs(before, after);

        // Goals
        expect(diffs.goals.created).toHaveLength(1);
        expect(diffs.goals.created[0].id).toBe("g3");
        expect(diffs.goals.updated).toHaveLength(1);
        expect(diffs.goals.updated[0].id).toBe("g1");
        expect(diffs.goals.deleted).toEqual(["g2"]);

        // Memories
        expect(diffs.memories.created).toHaveLength(1);
        expect(diffs.memories.created[0].id).toBe("m3");
        expect(diffs.memories.updated).toHaveLength(1);
        expect(diffs.memories.updated[0].id).toBe("m1");
        expect(diffs.memories.deleted).toEqual(["m2"]);

        // Signals
        expect(diffs.signals.created).toHaveLength(2);
        expect(diffs.signals.deleted).toEqual(["s1"]);
      });

      it("handles empty snapshots", () => {
        const empty = makeSnapshot();
        const diffs = computeDiffs(empty, empty);

        expect(diffs.goals.created).toHaveLength(0);
        expect(diffs.goals.updated).toHaveLength(0);
        expect(diffs.goals.deleted).toHaveLength(0);
        expect(diffs.memories.created).toHaveLength(0);
        expect(diffs.signals.created).toHaveLength(0);
      });
    });
  });
});
