import { describe, it, expect, beforeEach } from "vitest";

// Reset module state between tests
let withChatLock: typeof import("../chat-write-lock").withChatLock;

beforeEach(async () => {
  // Re-import to get fresh lock state
  const mod = await import("../chat-write-lock");
  withChatLock = mod.withChatLock;
});

describe("withChatLock", () => {
  it("executes a single operation and returns its result", async () => {
    const result = await withChatLock("chat1", async () => 42);
    expect(result).toBe(42);
  });

  it("serializes concurrent operations on the same key", async () => {
    const order: number[] = [];

    const op1 = withChatLock("chat1", async () => {
      await delay(30);
      order.push(1);
    });

    const op2 = withChatLock("chat1", async () => {
      order.push(2);
    });

    await Promise.all([op1, op2]);
    // op2 must wait for op1 even though op2 would finish faster
    expect(order).toEqual([1, 2]);
  });

  it("allows concurrent operations on different keys", async () => {
    const order: string[] = [];

    const op1 = withChatLock("chatA", async () => {
      await delay(30);
      order.push("A");
    });

    const op2 = withChatLock("chatB", async () => {
      order.push("B");
    });

    await Promise.all([op1, op2]);
    // Different keys run in parallel — B finishes first
    expect(order).toEqual(["B", "A"]);
  });

  it("continues the chain after an error", async () => {
    const failing = withChatLock("chat1", async () => {
      throw new Error("boom");
    });
    await expect(failing).rejects.toThrow("boom");

    // Next operation on the same key should still work
    const result = await withChatLock("chat1", async () => "recovered");
    expect(result).toBe("recovered");
  });

  it("serializes three operations in order", async () => {
    const order: number[] = [];

    const op1 = withChatLock("chat1", async () => {
      await delay(20);
      order.push(1);
    });
    const op2 = withChatLock("chat1", async () => {
      await delay(10);
      order.push(2);
    });
    const op3 = withChatLock("chat1", async () => {
      order.push(3);
    });

    await Promise.all([op1, op2, op3]);
    expect(order).toEqual([1, 2, 3]);
  });

  it("prevents read-modify-write race condition", async () => {
    // Simulates the actual bug: two operations reading/writing the same "record"
    let record = { messages: ["m1"], dashboardValues: {} as Record<string, string> };

    // Simulate messages persist (reads, delays, writes)
    const messagesPersist = withChatLock("chat1", async () => {
      const snapshot = { ...record, messages: [...record.messages] };
      await delay(10); // Simulate async IDB read
      snapshot.messages = ["m1", "m2"];
      record = { ...snapshot }; // Write back
    });

    // Simulate dashboard update (reads, modifies, writes)
    const dashUpdate = withChatLock("chat1", async () => {
      const snapshot = { ...record, dashboardValues: { ...record.dashboardValues } };
      snapshot.dashboardValues = { target_company: "MSFT" };
      record = { ...snapshot }; // Write back
    });

    await Promise.all([messagesPersist, dashUpdate]);

    // With the lock, both writes are preserved
    expect(record.messages).toEqual(["m1", "m2"]);
    expect(record.dashboardValues).toEqual({ target_company: "MSFT" });
  });
});

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
