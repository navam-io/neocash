import { allTools, WRITE_TOOLS, MEMORY_TOOLS, GOAL_TOOLS, type ToolName } from "../tool-schemas";

describe("tool-schemas", () => {
  const toolNames = Object.keys(allTools) as ToolName[];

  it("exports 15 tools", () => {
    expect(toolNames).toHaveLength(15);
  });

  it("every tool has a description", () => {
    for (const name of toolNames) {
      expect(allTools[name].description).toBeTruthy();
      expect(typeof allTools[name].description).toBe("string");
    }
  });

  it("every tool has an inputSchema", () => {
    for (const name of toolNames) {
      expect(allTools[name].inputSchema).toBeDefined();
    }
  });

  it("no tool has an execute function (client-side execution)", () => {
    for (const name of toolNames) {
      const tool = allTools[name] as Record<string, unknown>;
      expect(tool.execute).toBeUndefined();
    }
  });

  describe("READ tools", () => {
    const readTools: ToolName[] = [
      "list_goals", "get_goal", "list_signals",
      "list_memories", "list_documents", "list_chats",
    ];

    it("contains 6 read tools", () => {
      expect(readTools.every((t) => toolNames.includes(t))).toBe(true);
    });

    it("read tools are not in WRITE_TOOLS set", () => {
      for (const name of readTools) {
        expect(WRITE_TOOLS.has(name)).toBe(false);
      }
    });
  });

  describe("WRITE tools", () => {
    it("contains 9 write tools", () => {
      expect(WRITE_TOOLS.size).toBe(9);
    });

    it("all write tools exist in allTools", () => {
      for (const name of WRITE_TOOLS) {
        expect(toolNames).toContain(name);
      }
    });
  });

  describe("MEMORY_TOOLS subset", () => {
    it("contains save, update, delete memory", () => {
      expect(MEMORY_TOOLS.has("save_memory")).toBe(true);
      expect(MEMORY_TOOLS.has("update_memory")).toBe(true);
      expect(MEMORY_TOOLS.has("delete_memory")).toBe(true);
      expect(MEMORY_TOOLS.size).toBe(3);
    });

    it("is a subset of WRITE_TOOLS", () => {
      for (const name of MEMORY_TOOLS) {
        expect(WRITE_TOOLS.has(name)).toBe(true);
      }
    });
  });

  describe("GOAL_TOOLS subset", () => {
    it("contains goal-related write tools", () => {
      expect(GOAL_TOOLS.has("save_signal")).toBe(true);
      expect(GOAL_TOOLS.has("update_dashboard")).toBe(true);
      expect(GOAL_TOOLS.has("add_action_items")).toBe(true);
      expect(GOAL_TOOLS.has("complete_action_item")).toBe(true);
      expect(GOAL_TOOLS.has("add_insights")).toBe(true);
      expect(GOAL_TOOLS.has("update_goal_status")).toBe(true);
      expect(GOAL_TOOLS.size).toBe(6);
    });

    it("is a subset of WRITE_TOOLS", () => {
      for (const name of GOAL_TOOLS) {
        expect(WRITE_TOOLS.has(name)).toBe(true);
      }
    });
  });
});
