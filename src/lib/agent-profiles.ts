import type { ToolName } from "@/lib/tool-schemas";

// ─── Types ───────────────────────────────────────

export type AgentId =
  | "generalist"
  | "tax_advisor"
  | "portfolio_analyzer"
  | "budget_planner"
  | "estate_planner";

export interface AgentProfile {
  id: AgentId;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  systemPromptExtension: string;
  toolNames: ToolName[];
  keywords: string[];
  goalCategories: string[];
}

// ─── System Prompt Extensions ────────────────────

const TAX_ADVISOR_EXTENSION = `You are specialized in tax planning and optimization. Focus on:

- Tax brackets, marginal vs effective rates, and filing status implications
- Deductions: standard vs itemized, above-the-line deductions, QBI
- Tax-advantaged accounts: 401(k), IRA, Roth IRA, HSA, 529, FSA
- Estimated quarterly payments, safe harbor rules
- Capital gains and losses, wash sale rules, tax-loss harvesting
- AMT considerations, NIIT, state tax planning
- Tax credits: child tax credit, education credits, EV credits

Use \`save_memory\` to record tax-relevant facts (filing status, state, dependents). Use \`add_action_items\` for filing deadlines and tax-saving tasks.

When the user's question drifts outside your domain, provide a brief answer and note that a different area of expertise may be more relevant.`;

const PORTFOLIO_ANALYZER_EXTENSION = `You are specialized in investment and portfolio analysis. Focus on:

- Asset allocation: stocks/bonds/alternatives split, domestic vs international
- Diversification analysis: sector exposure, concentration risk, correlation
- Rebalancing triggers: threshold-based vs calendar-based, tax-efficient methods
- Risk assessment: risk tolerance alignment, drawdown analysis, time horizon
- Benchmark comparison: S&P 500, total market, blended benchmarks
- Fund analysis: expense ratios, tracking error, tax efficiency
- Investment strategies: index vs active, factor investing, dollar-cost averaging

Use \`update_dashboard\` for investment metrics (allocation percentages, returns). Use \`add_insights\` for portfolio observations and rebalancing recommendations.

When the user's question drifts outside your domain, provide a brief answer and note that a different area of expertise may be more relevant.`;

const BUDGET_PLANNER_EXTENSION = `You are specialized in budgeting and cash flow management. Focus on:

- Cash flow analysis: income vs expenses, surplus/deficit identification
- Spending categories: fixed vs variable, needs vs wants, subscriptions audit
- Savings rate optimization: pay-yourself-first, target percentages
- Emergency fund sizing: 3-6 months, high-yield savings placement
- Debt payoff strategies: avalanche (highest interest first) vs snowball (smallest balance first)
- Budget frameworks: 50/30/20 rule, zero-based budgeting, envelope method
- Expense tracking and reduction strategies

Use \`save_memory\` to record budget-relevant facts (income, fixed expenses, debt balances). Use \`add_action_items\` for budget tasks and debt payoff milestones.

When the user's question drifts outside your domain, provide a brief answer and note that a different area of expertise may be more relevant.`;

const ESTATE_PLANNER_EXTENSION = `You are specialized in estate planning and wealth transfer. Focus on:

- Beneficiary review: retirement accounts, life insurance, TOD/POD designations
- Trust types: revocable living trust, irrevocable trust, special needs trust
- Estate tax thresholds: federal exemption, state estate/inheritance taxes
- Powers of attorney: financial POA, healthcare POA, springing vs durable
- Healthcare directives: living will, HIPAA authorization, DNR considerations
- Inheritance planning: equal vs equitable distribution, blended families
- Gifting strategies: annual exclusion, lifetime exemption, 529 superfunding
- Business succession planning

Use \`save_memory\` to record estate-relevant facts (beneficiaries, existing documents). Use \`add_action_items\` for estate planning steps (draft will, update beneficiaries).

When the user's question drifts outside your domain, provide a brief answer and note that a different area of expertise may be more relevant.`;

// ─── Agent Profiles ──────────────────────────────

const ALL_READ_TOOLS: ToolName[] = [
  "list_goals", "get_goal", "list_signals",
  "list_memories", "list_documents", "list_chats",
];

const ALL_WRITE_TOOLS: ToolName[] = [
  "save_memory", "update_memory", "delete_memory",
  "save_signal", "update_dashboard", "add_action_items",
  "complete_action_item", "add_insights", "update_goal_status",
  "generate_dashboard", "scan_chats_for_signals",
];

const profiles: AgentProfile[] = [
  {
    id: "generalist",
    name: "NeoCash",
    description: "General-purpose financial assistant covering all wealth management topics.",
    icon: "Sparkles",
    systemPromptExtension: "",
    toolNames: [...ALL_READ_TOOLS, ...ALL_WRITE_TOOLS],
    keywords: [],
    goalCategories: ["business"],
  },
  {
    id: "tax_advisor",
    name: "Tax Advisor",
    description: "Tax planning, deductions, credits, tax-advantaged accounts, and filing strategies.",
    icon: "Receipt",
    systemPromptExtension: TAX_ADVISOR_EXTENSION,
    toolNames: [
      "list_memories", "list_documents", "list_goals",
      "save_memory", "save_signal", "add_action_items", "add_insights",
    ],
    keywords: [
      "tax", "taxes", "deduction", "deductions", "irs", "1099", "w2", "w-2",
      "filing", "bracket", "brackets", "withholding", "refund", "amended",
      "schedule", "form", "capital gains", "capital loss", "agi", "magi",
      "standard deduction", "itemized", "hsa", "fsa", "401k", "ira", "roth",
      "529", "qbi", "amt", "estimated payment", "quarterly",
    ],
    goalCategories: ["tax"],
  },
  {
    id: "portfolio_analyzer",
    name: "Portfolio Analyzer",
    description: "Investment analysis, asset allocation, rebalancing, and portfolio optimization.",
    icon: "TrendingUp",
    systemPromptExtension: PORTFOLIO_ANALYZER_EXTENSION,
    toolNames: [
      "list_memories", "list_goals", "list_signals", "get_goal",
      "save_memory", "save_signal", "update_dashboard", "add_insights",
    ],
    keywords: [
      "portfolio", "allocation", "rebalance", "rebalancing", "diversify",
      "diversification", "stock", "stocks", "bond", "bonds", "etf", "index fund",
      "mutual fund", "asset", "assets", "investment", "invest", "investing",
      "return", "returns", "yield", "dividend", "expense ratio", "benchmark",
      "s&p", "nasdaq", "vanguard", "fidelity", "schwab", "brokerage",
      "retirement account", "risk tolerance",
    ],
    goalCategories: ["investing", "retirement"],
  },
  {
    id: "budget_planner",
    name: "Budget Planner",
    description: "Budgeting, cash flow management, savings strategies, and debt payoff planning.",
    icon: "Wallet",
    systemPromptExtension: BUDGET_PLANNER_EXTENSION,
    toolNames: [
      "list_memories", "list_documents", "list_chats",
      "save_memory", "add_action_items", "complete_action_item", "save_signal",
    ],
    keywords: [
      "budget", "budgeting", "spending", "expenses", "expense", "cash flow",
      "savings", "saving", "save money", "emergency fund", "debt", "credit card",
      "loan", "mortgage payment", "student loan", "payoff", "pay off",
      "avalanche", "snowball", "interest rate", "minimum payment",
      "subscription", "groceries", "rent", "utility", "50/30/20",
    ],
    goalCategories: ["budgeting", "debt"],
  },
  {
    id: "estate_planner",
    name: "Estate Planner",
    description: "Estate planning, trusts, wills, beneficiaries, and wealth transfer strategies.",
    icon: "Shield",
    systemPromptExtension: ESTATE_PLANNER_EXTENSION,
    toolNames: [
      "list_memories", "list_documents", "list_goals",
      "save_memory", "save_signal", "add_action_items", "add_insights",
    ],
    keywords: [
      "estate", "will", "trust", "beneficiary", "beneficiaries", "inheritance",
      "probate", "executor", "power of attorney", "poa", "healthcare directive",
      "living will", "living trust", "revocable", "irrevocable", "guardian",
      "gifting", "gift tax", "estate tax", "succession", "heir", "heirs",
      "tod", "pod", "transfer on death",
    ],
    goalCategories: ["estate", "life-events"],
  },
];

// ─── Lookup Map ──────────────────────────────────

export const agentProfiles = new Map<AgentId, AgentProfile>(
  profiles.map((p) => [p.id, p]),
);

export function getAgentProfile(id: AgentId): AgentProfile {
  return agentProfiles.get(id) ?? agentProfiles.get("generalist")!;
}

export function getAgentByGoalCategory(category: string): AgentId {
  for (const profile of profiles) {
    if (profile.goalCategories.includes(category)) return profile.id;
  }
  return "generalist";
}
