import { getToolLabel, isWriteTool } from "../tool-labels";

describe("tool-labels", () => {
  describe("getToolLabel", () => {
    it("returns correct label for list_goals", () => {
      const label = getToolLabel("list_goals");
      expect(label.label).toBe("Your goals");
      expect(label.activeLabel).toContain("goals");
      expect(label.doneLabel).toContain("goals");
      expect(label.category).toBe("read");
    });

    it("returns correct label for save_memory", () => {
      const label = getToolLabel("save_memory");
      expect(label.label).toContain("profile");
      expect(label.category).toBe("write");
    });

    it("returns correct label for complete_action_item", () => {
      const label = getToolLabel("complete_action_item");
      expect(label.doneLabel).toContain("completed");
      expect(label.category).toBe("write");
    });

    it("returns fallback for unknown tool name", () => {
      const label = getToolLabel("nonexistent_tool");
      expect(label.label).toBe("Working");
      expect(label.activeLabel).toBe("Working...");
      expect(label.doneLabel).toBe("Done");
      expect(label.category).toBe("read");
    });

    it("returns correct label for generate_dashboard", () => {
      const label = getToolLabel("generate_dashboard");
      expect(label.label).toContain("dashboard");
      expect(label.activeLabel).toContain("dashboard");
      expect(label.doneLabel).toContain("Dashboard");
      expect(label.category).toBe("write");
    });

    it("returns correct label for scan_chats_for_signals", () => {
      const label = getToolLabel("scan_chats_for_signals");
      expect(label.label).toContain("conversations");
      expect(label.activeLabel).toContain("Scanning");
      expect(label.doneLabel).toContain("Scanned");
      expect(label.category).toBe("write");
    });

    it("returns an icon component for every known tool", () => {
      const tools = [
        "list_goals", "get_goal", "list_signals", "list_memories",
        "list_documents", "list_chats", "save_memory", "update_memory",
        "delete_memory", "save_signal", "update_dashboard",
        "add_action_items", "complete_action_item", "add_insights",
        "update_goal_status", "generate_dashboard", "scan_chats_for_signals",
      ];
      for (const name of tools) {
        const label = getToolLabel(name);
        // Lucide icons are forwardRef objects with a render function
        expect(label.icon).toBeDefined();
        expect(label.icon).not.toBeNull();
      }
    });
  });

  describe("isWriteTool", () => {
    it("returns true for write tools", () => {
      expect(isWriteTool("save_memory")).toBe(true);
      expect(isWriteTool("update_memory")).toBe(true);
      expect(isWriteTool("delete_memory")).toBe(true);
      expect(isWriteTool("save_signal")).toBe(true);
      expect(isWriteTool("update_dashboard")).toBe(true);
      expect(isWriteTool("add_action_items")).toBe(true);
      expect(isWriteTool("complete_action_item")).toBe(true);
      expect(isWriteTool("add_insights")).toBe(true);
      expect(isWriteTool("update_goal_status")).toBe(true);
      expect(isWriteTool("generate_dashboard")).toBe(true);
      expect(isWriteTool("scan_chats_for_signals")).toBe(true);
    });

    it("returns false for read tools", () => {
      expect(isWriteTool("list_goals")).toBe(false);
      expect(isWriteTool("get_goal")).toBe(false);
      expect(isWriteTool("list_signals")).toBe(false);
      expect(isWriteTool("list_memories")).toBe(false);
      expect(isWriteTool("list_documents")).toBe(false);
      expect(isWriteTool("list_chats")).toBe(false);
    });

    it("returns false for unknown tools", () => {
      expect(isWriteTool("unknown")).toBe(false);
    });
  });
});
