const mocks = vi.hoisted(() => ({
  saveSignal: vi.fn(async () => {}),
  incrementGoalSignals: vi.fn(async () => {}),
  updateDashboardValues: vi.fn(async () => {}),
  addActionItems: vi.fn(async () => {}),
  addInsights: vi.fn(async () => {}),
  nanoid: vi.fn(() => "signal_test_id"),
}));

// Use relative paths — @/ alias doesn't resolve in vi.mock() factories
vi.mock("../../hooks/useSignalStore", () => ({
  saveSignal: mocks.saveSignal,
  deleteSignalsForGoal: vi.fn(async () => {}),
}));
vi.mock("../../hooks/useGoalStore", () => ({
  incrementGoalSignals: mocks.incrementGoalSignals,
  updateDashboardValues: mocks.updateDashboardValues,
  addActionItems: mocks.addActionItems,
  addInsights: mocks.addInsights,
}));
vi.mock("nanoid", () => ({ nanoid: mocks.nanoid }));

import { processDetectedSignals } from "../signal-processing";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("processDetectedSignals", () => {
  const baseSignal = {
    goalId: "goal1",
    summary: "Found income data",
    category: "income",
  };

  it("saves signal and increments count for a single signal", async () => {
    const count = await processDetectedSignals(
      [baseSignal],
      "chat1",
      "msg1",
    );

    expect(count).toBe(1);
    expect(mocks.saveSignal).toHaveBeenCalledOnce();
    expect(mocks.incrementGoalSignals).toHaveBeenCalledWith("goal1");
  });

  it("returns 0 for empty array", async () => {
    const count = await processDetectedSignals([], "chat1", "msg1");
    expect(count).toBe(0);
    expect(mocks.saveSignal).not.toHaveBeenCalled();
  });

  it("calls updateDashboardValues when extractedValues present", async () => {
    const signal = {
      ...baseSignal,
      extractedValues: { income: 180000, taxRate: "24%" },
    };

    await processDetectedSignals([signal], "chat1", "msg1");

    expect(mocks.updateDashboardValues).toHaveBeenCalledWith(
      "goal1",
      expect.objectContaining({
        income: expect.objectContaining({
          value: 180000,
          sourceSignalId: "signal_test_id",
        }),
      }),
    );
  });

  it("calls addActionItems when actionItems present", async () => {
    const signal = {
      ...baseSignal,
      actionItems: [{ text: "File W-2", priority: "high" as const }],
    };

    await processDetectedSignals([signal], "chat1", "msg1");

    expect(mocks.addActionItems).toHaveBeenCalledWith(
      "goal1",
      expect.arrayContaining([
        expect.objectContaining({
          text: "File W-2",
          sourceSignalId: "signal_test_id",
        }),
      ]),
    );
  });

  it("calls addInsights when insights present", async () => {
    const signal = {
      ...baseSignal,
      insights: [{ text: "Consider Roth conversion", type: "recommendation" as const }],
    };

    await processDetectedSignals([signal], "chat1", "msg1");

    expect(mocks.addInsights).toHaveBeenCalledWith(
      "goal1",
      expect.arrayContaining([
        expect.objectContaining({
          text: "Consider Roth conversion",
          sourceSignalId: "signal_test_id",
        }),
      ]),
    );
  });

  it("skips dashboard update when no extractedValues", async () => {
    await processDetectedSignals([baseSignal], "chat1", "msg1");
    expect(mocks.updateDashboardValues).not.toHaveBeenCalled();
  });

  it("calls refreshGoalList when count > 0", async () => {
    const refresh = vi.fn();
    await processDetectedSignals([baseSignal], "chat1", "msg1", refresh);
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("skips refreshGoalList when count = 0", async () => {
    const refresh = vi.fn();
    await processDetectedSignals([], "chat1", "msg1", refresh);
    expect(refresh).not.toHaveBeenCalled();
  });
});
