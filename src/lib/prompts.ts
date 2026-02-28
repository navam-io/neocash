import type { PromptCategory } from "@/types";

/**
 * Replace year placeholders with dynamic values at render time.
 * Supports: {thisYear}, {lastYear}, {nextYear}
 */
export function resolvePromptYears(text: string): string {
  const year = new Date().getFullYear();
  return text
    .replace(/\{thisYear\}/g, String(year))
    .replace(/\{lastYear\}/g, String(year - 1))
    .replace(/\{nextYear\}/g, String(year + 1));
}

export const promptCategories: PromptCategory[] = [
  {
    id: "tax",
    label: "Tax & Filing",
    icon: "receipt",
    prompts: [
      {
        title: "Assess and file my taxes for {lastYear}",
        text: "I want to set a goal to assess and file my taxes for {lastYear}. Help me gather all necessary documents (W-2s, 1099s, deductions), identify credits I qualify for, and create a filing timeline to maximize my refund or minimize what I owe.",
      },
      {
        title: "Review quarterly estimated tax payments for {thisYear}",
        text: "I want to set a goal to review and plan my quarterly estimated tax payments for {thisYear}. Help me calculate what I owe each quarter, set payment deadlines, and avoid underpayment penalties.",
      },
      {
        title: "Evaluate tax-loss harvesting opportunities",
        text: "I want to set a goal to evaluate tax-loss harvesting opportunities in my portfolio. Help me identify positions with unrealized losses, calculate potential tax savings, and plan trades that maintain my target allocation.",
      },
      {
        title: "Optimize charitable giving and deduction strategy",
        text: "I want to set a goal to optimize my charitable giving and deduction strategy. Help me evaluate bunching donations, donor-advised funds, and qualified charitable distributions to maximize my tax benefit.",
      },
    ],
  },
  {
    id: "investing",
    label: "Investing & Markets",
    icon: "trending-up",
    prompts: [
      {
        title: "Evaluate my portfolio for growth, tax savings, and risk mitigation",
        text: "I want to set a goal to evaluate my portfolio of investments. Help me analyze my current holdings and recommend strategies for growth, tax savings, and risk mitigation across all my accounts.",
      },
      {
        title: "Buy/sell/hold analysis based on market conditions",
        text: "I want to set a goal to perform a buy/sell/hold analysis for a company. Based on current market conditions, industry trends, and the company's recent performance, help me build a rationale for my investment decision.",
      },
      {
        title: "Build a diversified ETF portfolio for long-term growth",
        text: "I want to set a goal to build a diversified ETF portfolio for long-term growth. Help me select asset classes, determine allocation percentages, and choose low-cost ETFs with a 20+ year time horizon.",
      },
      {
        title: "Create a dollar-cost averaging investment plan",
        text: "I want to set a goal to create a dollar-cost averaging investment plan. Help me determine how much to invest, set a schedule, choose target investments, and track my progress over time.",
      },
    ],
  },
  {
    id: "retirement",
    label: "Retirement & Savings",
    icon: "piggy-bank",
    prompts: [
      {
        title: "Maximize 401(k) and IRA contributions for {thisYear}",
        text: "I want to set a goal to maximize my 401(k) and IRA contributions for {thisYear}. Help me review contribution limits, employer matching, and the best strategy to fully fund my retirement accounts this year.",
      },
      {
        title: "Plan retirement withdrawal strategy",
        text: "I want to set a goal to plan my retirement withdrawal strategy. Help me determine the optimal order to withdraw from taxable, tax-deferred, and Roth accounts to minimize taxes and maximize longevity of my savings.",
      },
      {
        title: "Evaluate Roth conversion opportunity",
        text: "I want to set a goal to evaluate whether a Roth conversion makes sense for me. Help me analyze my current tax bracket, future projections, and the long-term benefit of converting traditional IRA funds to Roth.",
      },
      {
        title: "Build an emergency fund plan",
        text: "I want to set a goal to build my emergency fund. Help me determine the right target amount based on my expenses, create a savings plan with monthly milestones, and suggest the best accounts to hold it in.",
      },
    ],
  },
  {
    id: "budgeting",
    label: "Budgeting & Cash Flow",
    icon: "wallet",
    prompts: [
      {
        title: "Create a monthly zero-based budget",
        text: "I want to set a goal to create a zero-based budget for my monthly income. Help me categorize every dollar into spending, saving, and investing categories with clear targets for each.",
      },
      {
        title: "Reduce expenses and optimize spending",
        text: "I want to set a goal to reduce my monthly expenses. Help me audit my current spending, identify the biggest areas for savings, and create an action plan that maintains quality of life.",
      },
      {
        title: "Automate savings and bill payments",
        text: "I want to set a goal to automate my finances. Help me set up automatic transfers for savings, bill payments, and investment contributions so my money works without constant attention.",
      },
      {
        title: "Track and grow net worth",
        text: "I want to set a goal to track and grow my net worth. Help me catalog all assets and liabilities, set a target growth rate, and create monthly checkpoints to measure progress.",
      },
    ],
  },
  {
    id: "debt",
    label: "Debt & Credit",
    icon: "credit-card",
    prompts: [
      {
        title: "Pay off high-interest debt with milestones",
        text: "I want to set a goal to pay off my high-interest debt systematically. Help me list all debts, compare avalanche vs snowball strategies, create a payoff timeline with milestones, and find opportunities to accelerate payments.",
      },
      {
        title: "Improve credit score strategy",
        text: "I want to set a goal to improve my credit score. Help me understand my current score factors, create an action plan to address negative items, and set realistic milestones for improvement.",
      },
      {
        title: "Evaluate mortgage refinancing options",
        text: "I want to set a goal to evaluate mortgage refinancing. Help me compare my current rate to available options, calculate break-even points, and determine if refinancing makes financial sense.",
      },
      {
        title: "Create student loan repayment plan",
        text: "I want to set a goal to create a student loan repayment plan. Help me compare repayment options (standard, income-driven, refinancing), evaluate forgiveness programs, and build a timeline to become debt-free.",
      },
    ],
  },
  {
    id: "life-events",
    label: "Life Events",
    icon: "heart-handshake",
    prompts: [
      {
        title: "Plan finances for buying a home",
        text: "I want to set a goal to prepare financially for buying a home. Help me determine how much I can afford, build a down payment savings plan, understand closing costs, and get mortgage-ready.",
      },
      {
        title: "Prepare financially for a new baby",
        text: "I want to set a goal to prepare financially for a new baby. Help me estimate costs for the first year, adjust my budget, review insurance needs, and start planning for education savings.",
      },
      {
        title: "Navigate a job change or career transition",
        text: "I want to set a goal to navigate a job change financially. Help me evaluate compensation packages, manage benefits transitions, plan for any income gaps, and optimize my financial position during the switch.",
      },
      {
        title: "Plan finances for a wedding",
        text: "I want to set a goal to plan finances for a wedding. Help me set a realistic budget, create a savings timeline, prioritize spending categories, and avoid common financial pitfalls.",
      },
    ],
  },
  {
    id: "estate",
    label: "Estate & Insurance",
    icon: "shield",
    prompts: [
      {
        title: "Create or update my estate plan",
        text: "I want to set a goal to create or update my estate plan. Help me understand what documents I need (will, trust, POA, healthcare directive), identify beneficiary updates, and create a checklist to get everything in order.",
      },
      {
        title: "Review life and disability insurance coverage",
        text: "I want to set a goal to review my insurance coverage. Help me evaluate whether my life and disability insurance are adequate for my situation, compare policy types, and identify any gaps in coverage.",
      },
      {
        title: "Set up a college savings (529) plan",
        text: "I want to set a goal to set up a 529 college savings plan. Help me choose the right state plan, set contribution targets, select an investment strategy, and understand the tax benefits.",
      },
      {
        title: "Plan wealth transfer to heirs",
        text: "I want to set a goal to plan wealth transfer to my heirs. Help me understand gift tax exclusions, trust options, and strategies to pass on assets efficiently while minimizing estate taxes.",
      },
    ],
  },
  {
    id: "business",
    label: "Business & Side Income",
    icon: "briefcase",
    prompts: [
      {
        title: "Start and fund a side business",
        text: "I want to set a goal to start a side business. Help me evaluate funding options, set up proper business structure, plan initial expenses, and create revenue milestones.",
      },
      {
        title: "Optimize self-employment taxes for {thisYear}",
        text: "I want to set a goal to optimize my self-employment taxes for {thisYear}. Help me identify deductible expenses, plan quarterly payments, and evaluate business structures that could reduce my tax burden.",
      },
      {
        title: "Evaluate business retirement plans (SEP/SIMPLE/Solo 401k)",
        text: "I want to set a goal to choose the right business retirement plan. Help me compare SEP IRA, SIMPLE IRA, and Solo 401(k) options based on my income, contribution limits, and administrative requirements.",
      },
      {
        title: "Build passive income streams",
        text: "I want to set a goal to build passive income streams. Help me evaluate options like dividend investing, rental income, and digital products, then create a plan with income targets and timelines.",
      },
    ],
  },
];
