import { set } from "idb-keyval";
import type { ChatRecord, SignalRecord, DocumentRecord } from "@/types";

// Stable IDs for cross-referencing
const CHAT_IDS = {
  budget: "smp_budget01",
  taxLoss: "smp_taxloss1",
  emergency: "smp_emergncy",
};

const GOAL_IDS = {
  emergencyFund: "smp_goal_emr",
  taxAdvantaged: "smp_goal_tax",
};

const SIGNAL_IDS = {
  taxToGoal: "smp_sig_tx1",
  budgetToEmergency1: "smp_sig_be1",
  budgetToEmergency2: "smp_sig_be2",
};

const DOC_IDS = {
  budget: "smp_doc_bdgt",
  portfolio: "smp_doc_port",
  taxNotes: "smp_doc_taxn",
};

// Timestamps spread across last 14 days
function daysAgo(days: number): number {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

const MODEL = "claude-sonnet-4-6";

function msg(
  id: string,
  role: "user" | "assistant",
  text: string,
): { id: string; role: "user" | "assistant"; parts: { type: "text"; text: string }[] } {
  return { id, role, parts: [{ type: "text", text }] };
}

// ---------------------------------------------------------------------------
// Sample Chats
// ---------------------------------------------------------------------------

const budgetChat: ChatRecord = {
  id: CHAT_IDS.budget,
  title: "Budget Review for 2024",
  model: MODEL,
  createdAt: daysAgo(12),
  updatedAt: daysAgo(11),
  messages: [
    msg("b1", "user", "Can you help me review our 2024 household budget? We spent about $145,000 total last year."),
    msg("b2", "assistant", "I'd be happy to help you review your 2024 household budget. A total spend of $145,000 is a solid starting point. Let's break this down by category to identify where the money went and where there's room to optimize.\n\nHere are the typical major categories for a household budget at this level:\n\n**Housing (30-35%)**: $43,500-$50,750\n- Mortgage/rent, property taxes, insurance, maintenance\n\n**Transportation (10-15%)**: $14,500-$21,750\n- Car payments, insurance, fuel, maintenance\n\n**Food & Dining (10-12%)**: $14,500-$17,400\n- Groceries, restaurants, meal delivery\n\n**Healthcare (5-8%)**: $7,250-$11,600\n- Insurance premiums, co-pays, prescriptions\n\n**Savings & Investments (15-20%)**: $21,750-$29,000\n- 401(k), IRA, brokerage, emergency fund\n\nCan you share your approximate breakdown across these categories? That will help me identify specific optimization opportunities."),
    msg("b3", "user", "Housing was about $48,000, transportation $18,000, food around $16,000. We saved about $25,000 total across retirement accounts and our emergency fund."),
    msg("b4", "assistant", "Great breakdown! Let me analyze this:\n\n| Category | Amount | % of Total | Benchmark |\n|----------|--------|------------|-----------|\n| Housing | $48,000 | 33.1% | 30-35% ✅ |\n| Transportation | $18,000 | 12.4% | 10-15% ✅ |\n| Food & Dining | $16,000 | 11.0% | 10-12% ✅ |\n| Savings | $25,000 | 17.2% | 15-20% ✅ |\n| Other | $38,000 | 26.2% | — |\n\n**Key observations:**\n\n1. **You're within benchmarks across the board** — that's excellent discipline.\n2. **The $38,000 \"other\" category deserves scrutiny.** That's utilities, insurance, subscriptions, clothing, entertainment, gifts, etc. I'd recommend breaking this down further.\n3. **Savings rate of 17.2% is solid** but there may be room to push toward 20% by trimming the \"other\" bucket.\n\n**Quick wins to explore:**\n- Review subscriptions (streaming, software, memberships) — most households find $100-200/month in unused services\n- Check insurance rates annually — bundling home + auto often saves 10-15%\n- If your emergency fund has 6+ months of expenses, redirect overflow to tax-advantaged accounts\n\nWant me to help build a target budget for 2025?"),
    msg("b5", "user", "Yes, and I'm especially interested in whether we should redirect some savings from the emergency fund to retirement accounts."),
    msg("b6", "assistant", "Absolutely — this is one of the highest-impact decisions you can make. Let's think through it:\n\n## Emergency Fund Assessment\n\n**Recommended target**: 6 months of essential expenses\n- Your essential monthly spend ≈ $48K housing + $18K transport + $16K food = ~$82K/yr → **$6,833/month**\n- 6-month target: **~$41,000**\n\nIf your emergency fund is at or above $41,000, every additional dollar there earns a savings account rate (~4.5% APY currently) when it could be working harder in tax-advantaged accounts.\n\n## Redirect Strategy for 2025\n\nAssuming you're already contributing to your 401(k):\n\n1. **Max out 401(k)**: $23,500 limit for 2025 (up from $23,000)\n2. **Max out Roth IRA**: $7,000 per person ($14,000 if married filing jointly)\n3. **HSA if eligible**: $4,300 individual / $8,550 family — triple tax advantage\n\n**The math**: If you redirect $500/month from emergency fund overflow → Roth IRA, that's $6,000/year growing tax-free. Over 20 years at 8% average returns, that's roughly **$274,000** vs ~$148,000 in a savings account at 4%.\n\nShall I map out a specific monthly allocation plan for 2025?"),
  ] as ChatRecord["messages"],
};

const taxLossChat: ChatRecord = {
  id: CHAT_IDS.taxLoss,
  title: "Tax-Loss Harvesting Strategy",
  model: MODEL,
  createdAt: daysAgo(8),
  updatedAt: daysAgo(7),
  messages: [
    msg("t1", "user", "I have some unrealized losses in my brokerage account. Is now a good time for tax-loss harvesting?"),
    msg("t2", "assistant", "Tax-loss harvesting can be a powerful strategy. Let me walk you through the key considerations:\n\n## When Tax-Loss Harvesting Makes Sense\n\n**Good candidates:**\n- Positions with **unrealized losses** of $3,000+ (the annual deduction cap against ordinary income)\n- Positions you'd want to **rebalance anyway**\n- Assets where you can find a **substantially different** replacement (to avoid wash sale rules)\n\n**Wash Sale Rule Reminder:**\nYou cannot buy a \"substantially identical\" security within 30 days before or after the sale. For example:\n- Selling VTSAX → buying SWTSX (different fund, similar exposure) ✅\n- Selling VTSAX → buying VTSAX 29 days later ❌\n\n## Typical Savings\n\nIf you're in the 24% federal bracket + 5% state:\n- $10,000 harvested loss → ~$2,900 tax savings\n- $3,000 against ordinary income → ~$870 savings\n- Remaining $7,000 offsets capital gains or carries forward\n\nCan you share the approximate unrealized losses you're seeing? I can help prioritize which positions to harvest first."),
    msg("t3", "user", "I have about $12,000 in losses across two index funds and $3,500 in a single tech stock position."),
    msg("t4", "assistant", "Here's a prioritized harvesting plan:\n\n## Harvest Priority\n\n### 1. Index Fund Losses ($12,000) — Harvest First\n- **Why**: Easiest to swap into a similar-but-not-identical fund\n- **Action**: Sell both positions, immediately buy equivalent index funds from a different provider\n- **Example swaps**: Vanguard Total Market → Schwab Total Market, or S&P 500 → Total Market (different enough)\n- **Tax benefit**: $12,000 × 29% effective rate = **~$3,480 savings**\n\n### 2. Tech Stock ($3,500) — Harvest Second\n- **Why**: Individual stocks have no wash sale concern if you don't rebuy the same stock\n- **Action**: Sell the position, optionally reinvest in a tech sector ETF for similar exposure\n- **Tax benefit**: $3,500 × 29% = **~$1,015 savings**\n\n## Total Potential Savings: ~$4,495\n\n**Timing note**: Make sure all sales settle before December 31 if you want to claim for this tax year. Stock trades settle T+1, so any sale by December 30 should be fine.\n\n**Important**: Keep records of your cost basis and the replacement purchases. Your brokerage should track this, but having your own records makes tax filing much smoother.\n\nWant me to help you think through the replacement fund selection?"),
  ] as ChatRecord["messages"],
};

const emergencyChat: ChatRecord = {
  id: CHAT_IDS.emergency,
  title: "Emergency Fund Planning",
  model: MODEL,
  createdAt: daysAgo(5),
  updatedAt: daysAgo(4),
  messages: [
    msg("e1", "user", "We currently have $28,000 in our emergency fund. Is that enough, and where should we keep it?"),
    msg("e2", "assistant", "Let's evaluate your emergency fund against your specific situation:\n\n## Is $28,000 Enough?\n\n**The standard recommendation**: 3-6 months of essential expenses.\n\nBased on typical household expenses at your income level:\n- Essential monthly costs: ~$6,800 (housing + transport + food + insurance)\n- 3 months: $20,400\n- 6 months: **$40,800**\n\nAt $28,000, you're at roughly **4.1 months** — solidly in the recommended range but below the full 6-month buffer.\n\n**Should you aim for 6 months?** Consider:\n- ✅ If either earner has variable income or works in a volatile industry\n- ✅ If you have dependents\n- ✅ If you own a home (unexpected repairs)\n- ⚠️ Less urgent if both earners have stable employment and good insurance\n\n## Where to Keep It\n\n**Best options right now:**\n\n| Account Type | Current Rate | Liquidity | FDIC Insured |\n|-------------|-------------|-----------|-------------|\n| High-yield savings | 4.25-4.75% | Instant | Yes |\n| Money market | 4.30-4.80% | 1-2 days | Yes |\n| T-Bills (4-week) | 4.50-4.60% | Monthly | N/A (gov) |\n\nI'd recommend a **high-yield savings account** for at least 3 months of expenses (immediate access), and optionally a T-Bill ladder for the remainder.\n\nWant me to help you build a plan to reach the full 6-month target?"),
    msg("e3", "user", "Yes, let's build a plan to get to $41,000. We can save about $1,500/month beyond our current retirement contributions."),
    msg("e4", "assistant", "Here's your emergency fund completion plan:\n\n## Gap to Close: $13,000\n\nAt $1,500/month, you'll reach your target in **~8.7 months** — roughly by September if you start now.\n\n## Accelerated Timeline Options\n\n**Option A: Steady $1,500/month**\n- Timeline: ~9 months\n- Simple and predictable\n- No lifestyle changes needed\n\n**Option B: $2,000/month for 6.5 months**\n- Requires finding $500/month in savings\n- Review subscriptions, dining out, or one-time windfalls\n\n**Option C: Hybrid approach**\n- $1,500/month base\n- Direct any bonuses, tax refunds, or windfalls to the fund\n- Could finish in 5-7 months depending on timing\n\n## Recommended Setup\n\n1. **Open a high-yield savings account** if you don't have one (Marcus, Ally, or Wealthfront all offer 4.5%+)\n2. **Set up automatic transfer**: $1,500 on the 1st of each month\n3. **Create a \"done\" trigger**: Once you hit $41,000, redirect the $1,500 to your Roth IRA or brokerage\n\n**Bonus**: While building to $41,000, you'll earn roughly $400-500 in interest at current rates. Free money while you build your safety net.\n\nOnce you hit the target, we should revisit redirecting that $1,500/month to maximize your tax-advantaged accounts. That's where the real long-term wealth building happens."),
  ] as ChatRecord["messages"],
};

// ---------------------------------------------------------------------------
// Sample Goals
// ---------------------------------------------------------------------------

const emergencyFundGoal: ChatRecord = {
  id: GOAL_IDS.emergencyFund,
  title: "Build 6-Month Emergency Fund",
  model: MODEL,
  createdAt: daysAgo(10),
  updatedAt: daysAgo(3),
  goal: {
    type: "goal",
    description: "Accumulate $41,000 in a high-yield savings account to cover 6 months of essential household expenses, providing a financial safety net.",
    status: "active",
    category: "saving",
    signalCount: 2,
    crossPollinate: true,
    origin: "custom",
  },
  messages: [
    msg("g1_u", "user", "I want to build a 6-month emergency fund. We currently have $28,000 saved and need about $41,000 total."),
    msg("g1_a", "assistant", "Great goal! Based on your current savings of $28,000 and a target of $41,000, you need to accumulate an additional **$13,000**.\n\nHere's what I'll help you track:\n\n1. **Monthly contribution progress** toward the $13,000 gap\n2. **Interest earned** in your high-yield savings account\n3. **Milestone markers** at 4-month, 5-month, and 6-month coverage levels\n\nI'll also watch for relevant insights from your other financial conversations — like budget optimizations that could free up additional savings or investment rebalancing that might affect your liquid reserves.\n\nWhat's your planned monthly contribution toward this goal?"),
  ] as ChatRecord["messages"],
};

const taxAdvantagedGoal: ChatRecord = {
  id: GOAL_IDS.taxAdvantaged,
  title: "Maximize Tax-Advantaged Accounts",
  model: MODEL,
  createdAt: daysAgo(9),
  updatedAt: daysAgo(6),
  goal: {
    type: "goal",
    description: "Maximize annual contributions to 401(k), Roth IRA, and HSA accounts to reduce tax liability and accelerate long-term wealth growth through tax-advantaged compounding.",
    status: "active",
    category: "tax",
    signalCount: 1,
    crossPollinate: true,
    origin: "predefined",
  },
  messages: [
    msg("g2_u", "user", "I want to make sure I'm maximizing all my tax-advantaged account contributions this year."),
    msg("g2_a", "assistant", "Excellent priority! For 2025, here are the contribution limits to target:\n\n| Account | Limit | Status |\n|---------|-------|--------|\n| 401(k) | $23,500 | TBD |\n| Roth IRA | $7,000/person | TBD |\n| HSA (family) | $8,550 | TBD |\n\n**Total tax-advantaged space**: Up to $46,550 (single) or $53,550 (married, both contributing IRAs)\n\nI'll monitor your other conversations for signals about:\n- Available cash flow for contributions\n- Tax-loss harvesting opportunities that pair well with account funding\n- Income changes that might affect Roth IRA eligibility\n\nCan you share where you currently stand on each of these accounts for this year?"),
  ] as ChatRecord["messages"],
};

// ---------------------------------------------------------------------------
// Sample Signals
// ---------------------------------------------------------------------------

const signals: SignalRecord[] = [
  {
    id: SIGNAL_IDS.taxToGoal,
    goalId: GOAL_IDS.taxAdvantaged,
    sourceChatId: CHAT_IDS.taxLoss,
    sourceMessageId: "t4",
    summary: "Tax-loss harvesting could free up $4,495 in tax savings — potential redirect to Roth IRA contributions.",
    category: "tax_insight",
    createdAt: daysAgo(7),
  },
  {
    id: SIGNAL_IDS.budgetToEmergency1,
    goalId: GOAL_IDS.emergencyFund,
    sourceChatId: CHAT_IDS.budget,
    sourceMessageId: "b6",
    summary: "Budget review suggests redirecting emergency fund overflow to tax-advantaged accounts once 6-month target is met.",
    category: "savings_signal",
    createdAt: daysAgo(10),
  },
  {
    id: SIGNAL_IDS.budgetToEmergency2,
    goalId: GOAL_IDS.emergencyFund,
    sourceChatId: CHAT_IDS.emergency,
    sourceMessageId: "e4",
    summary: "Emergency fund plan targets $1,500/month automatic contributions — estimated completion in 9 months.",
    category: "savings_signal",
    createdAt: daysAgo(4),
  },
];

// ---------------------------------------------------------------------------
// Sample Documents (metadata only, no file bytes)
// ---------------------------------------------------------------------------

const documents: DocumentRecord[] = [
  {
    id: DOC_IDS.budget,
    filename: "2024-annual-budget.xlsx",
    mediaType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    chatId: CHAT_IDS.budget,
    metadata: "Annual Budget, Meridian Household",
    fileSize: 45_000,
    createdAt: daysAgo(12),
  },
  {
    id: DOC_IDS.portfolio,
    filename: "investment-portfolio-q4.pdf",
    mediaType: "application/pdf",
    chatId: CHAT_IDS.taxLoss,
    metadata: "Q4 Portfolio Summary, Index Fund Allocation",
    fileSize: 128_000,
    createdAt: daysAgo(8),
  },
  {
    id: DOC_IDS.taxNotes,
    filename: "tax-planning-notes.md",
    mediaType: "text/markdown",
    chatId: CHAT_IDS.taxLoss,
    metadata: "2024 Tax Strategy, Estimated Deductions",
    fileSize: 3_200,
    createdAt: daysAgo(6),
  },
];

// ---------------------------------------------------------------------------
// Hydration
// ---------------------------------------------------------------------------

export async function loadSampleData(): Promise<void> {
  // Chats
  for (const chat of [budgetChat, taxLossChat, emergencyChat]) {
    await set(`chat:${chat.id}`, chat);
  }

  // Goals (also stored as chat: prefix)
  for (const goal of [emergencyFundGoal, taxAdvantagedGoal]) {
    await set(`chat:${goal.id}`, goal);
  }

  // Signals
  for (const signal of signals) {
    await set(`signal:${signal.id}`, signal);
  }

  // Documents
  for (const doc of documents) {
    await set(`doc:${doc.id}`, doc);
  }
}
