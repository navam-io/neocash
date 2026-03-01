import { MCP_TOOL_PREFIX } from "@/mcp/financial-server";

// ─── Task Types ─────────────────────────────────

export type AgentTaskType =
  | "financial_health_check"
  | "tax_review"
  | "portfolio_analysis"
  | "budget_optimization"
  | "estate_review"
  | "cross_goal_report";

export interface SubAgentConfig {
  description: string;
  prompt: string;
  tools: string[];
  model?: string;
}

export interface AgentTaskConfig {
  description: string;
  subAgents: string[];
  buildPrompt: (goalIds?: string[]) => string;
}

// ─── MCP Tool Names (prefixed) ──────────────────

const mcpTool = (name: string) => `${MCP_TOOL_PREFIX}${name}`;

// Read tools available to all sub-agents
const READ_MCP_TOOLS = [
  mcpTool("list_goals"),
  mcpTool("get_goal"),
  mcpTool("list_memories"),
  mcpTool("list_signals"),
  mcpTool("list_documents"),
  mcpTool("list_chats"),
];

// ─── Sub-Agent Definitions ──────────────────────

export const subAgentConfigs: Record<string, SubAgentConfig> = {
  tax_analyst: {
    description:
      "Tax planning specialist. Use for tax bracket analysis, deduction optimization, tax-advantaged account strategy, and filing recommendations.",
    prompt: `You are a tax planning specialist analyzing a user's financial data.

Focus on:
- Tax brackets, marginal vs effective rates, filing status implications
- Deduction opportunities: standard vs itemized, above-the-line, QBI
- Tax-advantaged accounts: 401(k), IRA, Roth IRA, HSA, 529
- Capital gains optimization, tax-loss harvesting opportunities
- Estimated payments and safe harbor compliance

Use the MCP tools to read the user's profile, goals, and signals. Update dashboards with tax-related metrics you compute. Add insights for tax optimization opportunities and warnings for potential issues. Add action items for concrete tax-saving steps.

Be specific with numbers. Reference current tax year limits and thresholds.`,
    tools: [
      ...READ_MCP_TOOLS,
      mcpTool("update_dashboard"),
      mcpTool("add_insights"),
      mcpTool("add_action_items"),
      mcpTool("save_signal"),
      mcpTool("save_memory"),
    ],
    model: "sonnet",
  },

  portfolio_analyst: {
    description:
      "Investment analysis specialist. Use for asset allocation review, diversification analysis, rebalancing recommendations, and risk assessment.",
    prompt: `You are an investment analysis specialist reviewing a user's portfolio and investment goals.

Focus on:
- Asset allocation: stocks/bonds/alternatives, domestic vs international
- Diversification: sector concentration, correlation analysis
- Rebalancing: threshold triggers, tax-efficient methods
- Risk assessment: alignment with time horizon and risk tolerance
- Fund analysis: expense ratios, tax efficiency
- Performance vs benchmarks

Use the MCP tools to read portfolio data, goals, and memories. Update dashboards with allocation percentages, risk metrics, and performance data. Add insights for rebalancing opportunities and portfolio risks.

Provide specific allocations and percentages where possible.`,
    tools: [
      ...READ_MCP_TOOLS,
      mcpTool("update_dashboard"),
      mcpTool("add_insights"),
      mcpTool("save_signal"),
    ],
    model: "sonnet",
  },

  budget_analyst: {
    description:
      "Budget and cash flow specialist. Use for spending analysis, savings rate optimization, debt payoff strategy, and emergency fund planning.",
    prompt: `You are a budgeting and cash flow specialist analyzing a user's financial situation.

Focus on:
- Cash flow analysis: income vs expenses, surplus/deficit
- Savings rate: current vs target, optimization paths
- Debt strategy: avalanche vs snowball, payoff timelines
- Emergency fund: sizing, placement, progress
- Budget frameworks: 50/30/20, zero-based
- Subscription and expense reduction opportunities

Use the MCP tools to read the user's income, expenses, debt information, and budget goals. Update dashboards with cash flow metrics. Add action items for budget improvements and debt milestones.

Provide specific dollar amounts and timeframes.`,
    tools: [
      ...READ_MCP_TOOLS,
      mcpTool("update_dashboard"),
      mcpTool("add_insights"),
      mcpTool("add_action_items"),
      mcpTool("save_signal"),
      mcpTool("save_memory"),
    ],
    model: "sonnet",
  },

  estate_analyst: {
    description:
      "Estate planning specialist. Use for beneficiary review, trust analysis, estate tax planning, and wealth transfer strategy.",
    prompt: `You are an estate planning specialist reviewing a user's estate plan.

Focus on:
- Beneficiary designations: retirement accounts, insurance, TOD/POD
- Trust structures: revocable living trust, irrevocable options
- Estate tax: federal exemption usage, state-level considerations
- Powers of attorney and healthcare directives
- Gifting strategy: annual exclusion, lifetime exemption
- Business succession if applicable

Use the MCP tools to read the user's family info, assets, documents, and estate goals. Update dashboards with estate plan completeness metrics. Add action items for missing documents and beneficiary updates.

Flag gaps in coverage and recommend professional consultations where appropriate.`,
    tools: [
      ...READ_MCP_TOOLS,
      mcpTool("update_dashboard"),
      mcpTool("add_insights"),
      mcpTool("add_action_items"),
      mcpTool("save_signal"),
    ],
    model: "sonnet",
  },
};

// ─── Task Configurations ────────────────────────

export const agentTasks: Record<AgentTaskType, AgentTaskConfig> = {
  financial_health_check: {
    description: "Comprehensive cross-domain financial analysis covering tax, investments, budget, and estate planning.",
    subAgents: ["tax_analyst", "portfolio_analyst", "budget_analyst", "estate_analyst"],
    buildPrompt: (goalIds) => {
      const goalClause = goalIds?.length
        ? `Focus especially on these goals: ${goalIds.join(", ")}.`
        : "Analyze all active goals.";

      return `Perform a comprehensive financial health check for the user.

${goalClause}

Steps:
1. First, use list_goals and list_memories to understand the user's full financial picture.
2. Delegate to each specialist sub-agent:
   - tax_analyst: Review tax situation, identify optimization opportunities
   - portfolio_analyst: Analyze investment allocation and performance
   - budget_analyst: Evaluate cash flow, savings rate, and debt management
   - estate_analyst: Check estate plan completeness
3. Synthesize findings across all domains. Look for:
   - Cross-domain synergies (e.g., tax-efficient investing, estate-aware budgeting)
   - Conflicts between goals
   - Priority recommendations ranked by impact
4. Update relevant goal dashboards with computed metrics.
5. Add action items for the top 5 most impactful improvements.
6. Add insights for key findings and warnings.

Provide a structured summary with sections for each domain and a cross-cutting priorities section.`;
    },
  },

  tax_review: {
    description: "Deep analysis of tax situation including deductions, credits, and tax-advantaged account optimization.",
    subAgents: ["tax_analyst"],
    buildPrompt: (goalIds) => {
      const goalClause = goalIds?.length
        ? `Focus on these tax-related goals: ${goalIds.join(", ")}.`
        : "Review all tax-related goals and the user's overall tax situation.";

      return `Perform a detailed tax review for the user.

${goalClause}

Steps:
1. Use list_memories to get the user's tax profile (filing status, income, state, dependents).
2. Use list_goals to find tax-related goals and get their details.
3. Use list_documents to check for uploaded tax documents.
4. Delegate to tax_analyst to:
   - Calculate estimated tax liability
   - Identify available deductions and credits
   - Optimize tax-advantaged account contributions (401k, IRA, HSA, 529)
   - Check estimated payment compliance
   - Identify tax-loss harvesting opportunities
5. Update goal dashboards with computed tax metrics.
6. Add concrete action items with deadlines.
7. Add insights for optimization opportunities.

Provide specific dollar amounts for potential tax savings.`;
    },
  },

  portfolio_analysis: {
    description: "Investment allocation analysis, rebalancing recommendations, and risk assessment.",
    subAgents: ["portfolio_analyst"],
    buildPrompt: (goalIds) => {
      const goalClause = goalIds?.length
        ? `Focus on these investment goals: ${goalIds.join(", ")}.`
        : "Review all investment and retirement goals.";

      return `Perform a detailed portfolio analysis for the user.

${goalClause}

Steps:
1. Use list_memories to get the user's investment profile (accounts, risk tolerance, time horizon).
2. Use list_goals to find investment-related goals.
3. Delegate to portfolio_analyst to:
   - Analyze current asset allocation
   - Assess diversification across sectors and geographies
   - Identify rebalancing opportunities
   - Compare performance to relevant benchmarks
   - Evaluate fund expense ratios and tax efficiency
4. Update goal dashboards with allocation and performance metrics.
5. Add action items for rebalancing steps.
6. Add insights for portfolio risks and opportunities.

Provide specific allocation percentages and benchmark comparisons.`;
    },
  },

  budget_optimization: {
    description: "Spending analysis, savings rate optimization, and debt payoff strategy.",
    subAgents: ["budget_analyst"],
    buildPrompt: (goalIds) => {
      const goalClause = goalIds?.length
        ? `Focus on these budget/debt goals: ${goalIds.join(", ")}.`
        : "Review all budget and debt-related goals.";

      return `Perform a detailed budget optimization analysis for the user.

${goalClause}

Steps:
1. Use list_memories to get income, expenses, and debt information.
2. Use list_goals to find budget and debt-related goals.
3. Delegate to budget_analyst to:
   - Map cash flow: income vs expenses
   - Calculate current savings rate and compare to targets
   - Evaluate debt payoff strategy (avalanche vs snowball)
   - Assess emergency fund adequacy
   - Identify expense reduction opportunities
4. Update goal dashboards with cash flow metrics.
5. Add action items for budget improvements.
6. Add insights for savings opportunities.

Provide specific dollar amounts, savings rates, and debt payoff timelines.`;
    },
  },

  estate_review: {
    description: "Estate plan completeness check including beneficiaries, trusts, and wealth transfer strategy.",
    subAgents: ["estate_analyst"],
    buildPrompt: (goalIds) => {
      const goalClause = goalIds?.length
        ? `Focus on these estate goals: ${goalIds.join(", ")}.`
        : "Review all estate planning goals.";

      return `Perform a detailed estate plan review for the user.

${goalClause}

Steps:
1. Use list_memories to get family info, assets, and existing estate documents.
2. Use list_goals to find estate-related goals.
3. Use list_documents to check for uploaded estate documents.
4. Delegate to estate_analyst to:
   - Review beneficiary designations across all accounts
   - Assess trust structure needs
   - Check estate tax exposure
   - Verify powers of attorney and healthcare directives
   - Evaluate gifting strategy
5. Update goal dashboards with estate plan completeness metrics.
6. Add action items for missing documents and updates needed.
7. Add insights for estate planning gaps and opportunities.

Create a checklist of estate planning essentials with completion status.`;
    },
  },

  cross_goal_report: {
    description: "Analysis of how goals interact, conflict, or complement each other.",
    subAgents: ["tax_analyst", "portfolio_analyst", "budget_analyst", "estate_analyst"],
    buildPrompt: (goalIds) => {
      const goalClause = goalIds?.length
        ? `Analyze these specific goals: ${goalIds.join(", ")}.`
        : "Analyze all active goals.";

      return `Perform a cross-goal interaction analysis for the user.

${goalClause}

Steps:
1. Use list_goals to get all active goals and their details.
2. Use list_memories for the user's full financial context.
3. For each pair of goals, analyze:
   - **Synergies**: How do they reinforce each other? (e.g., 401k contributions reduce taxes AND build retirement)
   - **Conflicts**: Where do they compete for resources? (e.g., aggressive debt payoff vs maximum retirement contributions)
   - **Dependencies**: Which goals should be sequenced? (e.g., emergency fund before investing)
4. Delegate to relevant specialists for domain-specific analysis.
5. Create a prioritized ranking of goals based on:
   - Impact (financial benefit)
   - Urgency (time-sensitive deadlines)
   - Dependencies (what blocks what)
6. Add cross-pollination signals between related goals.
7. Add insights about goal conflicts and recommended tradeoffs.

Provide a clear priority matrix and recommended sequencing.`;
    },
  },
};

// ─── Helpers ────────────────────────────────────

export function getTaskConfig(task: AgentTaskType): AgentTaskConfig {
  return agentTasks[task];
}

export function getSubAgentConfig(name: string): SubAgentConfig | undefined {
  return subAgentConfigs[name];
}

export function buildTaskPrompt(task: AgentTaskType, goalIds?: string[]): string {
  return agentTasks[task].buildPrompt(goalIds);
}

export const ALL_TASK_TYPES: AgentTaskType[] = [
  "financial_health_check",
  "tax_review",
  "portfolio_analysis",
  "budget_optimization",
  "estate_review",
  "cross_goal_report",
];
