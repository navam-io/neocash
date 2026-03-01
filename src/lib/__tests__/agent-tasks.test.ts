import {
  agentTasks,
  subAgentConfigs,
  getTaskConfig,
  getSubAgentConfig,
  buildTaskPrompt,
  ALL_TASK_TYPES,
  type AgentTaskType,
} from "../agent-tasks";
import { MCP_TOOL_PREFIX } from "@/mcp/financial-server";

describe("agent-tasks", () => {
  describe("ALL_TASK_TYPES", () => {
    it("defines 6 task types", () => {
      expect(ALL_TASK_TYPES).toHaveLength(6);
    });

    it("includes all expected task types", () => {
      const expected: AgentTaskType[] = [
        "financial_health_check",
        "tax_review",
        "portfolio_analysis",
        "budget_optimization",
        "estate_review",
        "cross_goal_report",
      ];
      for (const t of expected) {
        expect(ALL_TASK_TYPES).toContain(t);
      }
    });
  });

  describe("task configurations", () => {
    for (const taskType of ALL_TASK_TYPES) {
      describe(taskType, () => {
        const config = agentTasks[taskType];

        it("has a non-empty description", () => {
          expect(config.description.length).toBeGreaterThan(0);
        });

        it("has at least one sub-agent", () => {
          expect(config.subAgents.length).toBeGreaterThan(0);
        });

        it("references only defined sub-agents", () => {
          for (const name of config.subAgents) {
            expect(subAgentConfigs[name]).toBeDefined();
          }
        });

        it("buildPrompt returns non-empty string", () => {
          const prompt = config.buildPrompt();
          expect(prompt.length).toBeGreaterThan(0);
        });

        it("buildPrompt includes goal IDs when provided", () => {
          const prompt = config.buildPrompt(["g1", "g2"]);
          expect(prompt).toContain("g1");
          expect(prompt).toContain("g2");
        });
      });
    }
  });

  describe("multi-agent tasks", () => {
    it("financial_health_check uses all 4 specialists", () => {
      const config = agentTasks.financial_health_check;
      expect(config.subAgents).toHaveLength(4);
      expect(config.subAgents).toContain("tax_analyst");
      expect(config.subAgents).toContain("portfolio_analyst");
      expect(config.subAgents).toContain("budget_analyst");
      expect(config.subAgents).toContain("estate_analyst");
    });

    it("cross_goal_report uses all 4 specialists", () => {
      const config = agentTasks.cross_goal_report;
      expect(config.subAgents).toHaveLength(4);
    });

    it("single-domain tasks use exactly 1 sub-agent", () => {
      expect(agentTasks.tax_review.subAgents).toHaveLength(1);
      expect(agentTasks.portfolio_analysis.subAgents).toHaveLength(1);
      expect(agentTasks.budget_optimization.subAgents).toHaveLength(1);
      expect(agentTasks.estate_review.subAgents).toHaveLength(1);
    });
  });

  describe("sub-agent configurations", () => {
    it("defines 4 sub-agents", () => {
      expect(Object.keys(subAgentConfigs)).toHaveLength(4);
    });

    for (const [name, config] of Object.entries(subAgentConfigs)) {
      describe(name, () => {
        it("has a non-empty description", () => {
          expect(config.description.length).toBeGreaterThan(0);
        });

        it("has a non-empty prompt", () => {
          expect(config.prompt.length).toBeGreaterThan(0);
        });

        it("has at least 1 tool", () => {
          expect(config.tools.length).toBeGreaterThan(0);
        });

        it("all tools are prefixed with MCP tool prefix", () => {
          for (const tool of config.tools) {
            expect(tool.startsWith(MCP_TOOL_PREFIX)).toBe(true);
          }
        });

        it("includes read tools", () => {
          const readTools = config.tools.filter((t) =>
            t.includes("list_") || t.includes("get_"),
          );
          expect(readTools.length).toBeGreaterThan(0);
        });

        it("includes at least one write tool", () => {
          const writeTools = config.tools.filter(
            (t) => !t.includes("list_") && !t.includes("get_"),
          );
          expect(writeTools.length).toBeGreaterThan(0);
        });
      });
    }
  });

  describe("getTaskConfig", () => {
    it("returns config for valid task type", () => {
      const config = getTaskConfig("tax_review");
      expect(config.description).toBeTruthy();
      expect(config.subAgents).toContain("tax_analyst");
    });
  });

  describe("getSubAgentConfig", () => {
    it("returns config for valid sub-agent name", () => {
      const config = getSubAgentConfig("tax_analyst");
      expect(config).toBeDefined();
      expect(config!.description).toBeTruthy();
    });

    it("returns undefined for unknown sub-agent", () => {
      const config = getSubAgentConfig("unknown");
      expect(config).toBeUndefined();
    });
  });

  describe("buildTaskPrompt", () => {
    it("returns prompt for valid task", () => {
      const prompt = buildTaskPrompt("financial_health_check");
      expect(prompt).toContain("financial health check");
    });

    it("includes goal IDs when provided", () => {
      const prompt = buildTaskPrompt("tax_review", ["goal-abc", "goal-def"]);
      expect(prompt).toContain("goal-abc");
      expect(prompt).toContain("goal-def");
    });

    it("mentions analyzing all goals when no IDs provided", () => {
      const prompt = buildTaskPrompt("financial_health_check");
      expect(prompt).toMatch(/all|active/i);
    });
  });
});
