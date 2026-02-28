const mocks = vi.hoisted(() => ({
  toggleActionItem: vi.fn(async () => {}),
}));

vi.mock("../../hooks/useGoalStore", () => ({
  toggleActionItem: mocks.toggleActionItem,
}));

import { processDetectedCompletions } from "../action-completion";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("processDetectedCompletions", () => {
  it("toggles each completed action item", async () => {
    const actionGoalMap = new Map([
      ["action1", "goal1"],
      ["action2", "goal1"],
      ["action3", "goal2"],
    ]);

    const count = await processDetectedCompletions(
      ["action1", "action3"],
      actionGoalMap,
    );

    expect(count).toBe(2);
    expect(mocks.toggleActionItem).toHaveBeenCalledTimes(2);
    expect(mocks.toggleActionItem).toHaveBeenCalledWith("goal1", "action1");
    expect(mocks.toggleActionItem).toHaveBeenCalledWith("goal2", "action3");
  });

  it("returns 0 for empty completedIds", async () => {
    const actionGoalMap = new Map([["action1", "goal1"]]);
    const count = await processDetectedCompletions([], actionGoalMap);

    expect(count).toBe(0);
    expect(mocks.toggleActionItem).not.toHaveBeenCalled();
  });

  it("skips unknown action IDs not in the map", async () => {
    const actionGoalMap = new Map([["action1", "goal1"]]);

    const count = await processDetectedCompletions(
      ["action1", "unknown_id"],
      actionGoalMap,
    );

    expect(count).toBe(1);
    expect(mocks.toggleActionItem).toHaveBeenCalledTimes(1);
    expect(mocks.toggleActionItem).toHaveBeenCalledWith("goal1", "action1");
  });

  it("handles multiple actions from the same goal", async () => {
    const actionGoalMap = new Map([
      ["action1", "goal1"],
      ["action2", "goal1"],
    ]);

    const count = await processDetectedCompletions(
      ["action1", "action2"],
      actionGoalMap,
    );

    expect(count).toBe(2);
    expect(mocks.toggleActionItem).toHaveBeenCalledWith("goal1", "action1");
    expect(mocks.toggleActionItem).toHaveBeenCalledWith("goal1", "action2");
  });

  it("handles empty actionGoalMap", async () => {
    const actionGoalMap = new Map<string, string>();

    const count = await processDetectedCompletions(
      ["action1"],
      actionGoalMap,
    );

    expect(count).toBe(0);
    expect(mocks.toggleActionItem).not.toHaveBeenCalled();
  });

  it("handles actions from multiple different goals", async () => {
    const actionGoalMap = new Map([
      ["a1", "goal1"],
      ["a2", "goal2"],
      ["a3", "goal3"],
    ]);

    const count = await processDetectedCompletions(
      ["a1", "a2", "a3"],
      actionGoalMap,
    );

    expect(count).toBe(3);
    expect(mocks.toggleActionItem).toHaveBeenCalledWith("goal1", "a1");
    expect(mocks.toggleActionItem).toHaveBeenCalledWith("goal2", "a2");
    expect(mocks.toggleActionItem).toHaveBeenCalledWith("goal3", "a3");
  });
});
