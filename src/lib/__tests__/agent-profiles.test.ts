import {
  agentProfiles,
  getAgentProfile,
  getAgentByGoalCategory,
  type AgentId,
} from "../agent-profiles";
import { allTools, getToolSubset, type ToolName } from "../tool-schemas";

const ALL_TOOL_NAMES = Object.keys(allTools) as ToolName[];
const ALL_AGENT_IDS: AgentId[] = [
  "generalist", "tax_advisor", "portfolio_analyzer", "budget_planner", "estate_planner",
];

describe("agent-profiles", () => {
  it("defines 5 agent profiles", () => {
    expect(agentProfiles.size).toBe(5);
  });

  it("includes all expected agent IDs", () => {
    for (const id of ALL_AGENT_IDS) {
      expect(agentProfiles.has(id)).toBe(true);
    }
  });

  describe("profile validation", () => {
    for (const [id, profile] of agentProfiles) {
      describe(id, () => {
        it("has a non-empty name", () => {
          expect(profile.name.length).toBeGreaterThan(0);
        });

        it("has a non-empty description", () => {
          expect(profile.description.length).toBeGreaterThan(0);
        });

        it("has a valid icon name", () => {
          expect(profile.icon.length).toBeGreaterThan(0);
        });

        it("has all tool names present in allTools", () => {
          for (const toolName of profile.toolNames) {
            expect(ALL_TOOL_NAMES).toContain(toolName);
          }
        });

        it("has no duplicate tool names", () => {
          const unique = new Set(profile.toolNames);
          expect(unique.size).toBe(profile.toolNames.length);
        });

        if (id !== "generalist") {
          it("has a non-empty systemPromptExtension", () => {
            expect(profile.systemPromptExtension.length).toBeGreaterThan(0);
          });

          it("has keywords for classification", () => {
            expect(profile.keywords.length).toBeGreaterThan(0);
          });

          it("systemPromptExtension ends with domain-drift guidance", () => {
            expect(profile.systemPromptExtension).toContain(
              "outside your domain",
            );
          });
        }

        if (id === "generalist") {
          it("has empty systemPromptExtension", () => {
            expect(profile.systemPromptExtension).toBe("");
          });

          it("has all tools", () => {
            expect(profile.toolNames.length).toBe(ALL_TOOL_NAMES.length);
          });
        }
      });
    }
  });

  describe("goal category coverage", () => {
    const EXPECTED_CATEGORIES = [
      "tax", "investing", "retirement", "budgeting", "debt",
      "estate", "life-events", "business",
    ];

    it("covers all 8 goal categories across agent profiles", () => {
      const coveredCategories = new Set<string>();
      for (const profile of agentProfiles.values()) {
        for (const cat of profile.goalCategories) {
          coveredCategories.add(cat);
        }
      }
      for (const cat of EXPECTED_CATEGORIES) {
        expect(coveredCategories.has(cat)).toBe(true);
      }
    });

    it("each category maps to exactly one agent", () => {
      const categoryToAgents = new Map<string, string[]>();
      for (const profile of agentProfiles.values()) {
        for (const cat of profile.goalCategories) {
          const agents = categoryToAgents.get(cat) || [];
          agents.push(profile.id);
          categoryToAgents.set(cat, agents);
        }
      }
      for (const [cat, agents] of categoryToAgents) {
        expect(agents).toHaveLength(1);
      }
    });
  });

  describe("getAgentProfile", () => {
    it("returns correct profile for each agent ID", () => {
      for (const id of ALL_AGENT_IDS) {
        const profile = getAgentProfile(id);
        expect(profile.id).toBe(id);
      }
    });

    it("falls back to generalist for unknown ID", () => {
      const profile = getAgentProfile("unknown_agent" as AgentId);
      expect(profile.id).toBe("generalist");
    });
  });

  describe("getAgentByGoalCategory", () => {
    it("maps tax category to tax_advisor", () => {
      expect(getAgentByGoalCategory("tax")).toBe("tax_advisor");
    });

    it("maps investing category to portfolio_analyzer", () => {
      expect(getAgentByGoalCategory("investing")).toBe("portfolio_analyzer");
    });

    it("maps retirement category to portfolio_analyzer", () => {
      expect(getAgentByGoalCategory("retirement")).toBe("portfolio_analyzer");
    });

    it("maps budgeting category to budget_planner", () => {
      expect(getAgentByGoalCategory("budgeting")).toBe("budget_planner");
    });

    it("maps debt category to budget_planner", () => {
      expect(getAgentByGoalCategory("debt")).toBe("budget_planner");
    });

    it("maps estate category to estate_planner", () => {
      expect(getAgentByGoalCategory("estate")).toBe("estate_planner");
    });

    it("maps life-events category to estate_planner", () => {
      expect(getAgentByGoalCategory("life-events")).toBe("estate_planner");
    });

    it("maps business category to generalist", () => {
      expect(getAgentByGoalCategory("business")).toBe("generalist");
    });

    it("returns generalist for unknown categories", () => {
      expect(getAgentByGoalCategory("underwater_basket_weaving")).toBe("generalist");
    });
  });

  describe("getToolSubset", () => {
    it("returns only requested tools", () => {
      const subset = getToolSubset(["list_goals", "save_memory"]);
      const keys = Object.keys(subset);
      expect(keys).toHaveLength(2);
      expect(keys).toContain("list_goals");
      expect(keys).toContain("save_memory");
    });

    it("returns correct tools for tax_advisor profile", () => {
      const profile = getAgentProfile("tax_advisor");
      const subset = getToolSubset(profile.toolNames);
      const keys = Object.keys(subset);
      expect(keys).toHaveLength(profile.toolNames.length);
      for (const name of profile.toolNames) {
        expect(keys).toContain(name);
      }
    });

    it("returns all tools for generalist profile", () => {
      const profile = getAgentProfile("generalist");
      const subset = getToolSubset(profile.toolNames);
      expect(Object.keys(subset)).toHaveLength(ALL_TOOL_NAMES.length);
    });

    it("ignores unknown tool names", () => {
      const subset = getToolSubset(["list_goals", "nonexistent_tool" as ToolName]);
      expect(Object.keys(subset)).toHaveLength(1);
      expect(Object.keys(subset)).toContain("list_goals");
    });
  });
});
