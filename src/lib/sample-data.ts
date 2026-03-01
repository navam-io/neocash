import { set } from "idb-keyval";
import type {
  ChatRecord,
  SignalRecord,
  DocumentRecord,
  MemoryRecord,
  ActionItem,
  Insight,
  DashboardSchema,
  DashboardValues,
} from "@/types";

// ---------------------------------------------------------------------------
// Stable IDs for cross-referencing
// ---------------------------------------------------------------------------

const CHAT_IDS = {
  taxStrategy: "smp_chat_tax1",
  portfolioRebal: "smp_chat_port",
  portfolioPerf: "smp_chat_pprf",
  emergencyDone: "smp_chat_emrg",
  studentLoan: "smp_chat_loan",
  familyTrust: "smp_chat_trst",
  collegeSavings: "smp_chat_529p",
  homeInsurance: "smp_chat_hins",
  yearEndHealth: "smp_chat_yend",
};

const GOAL_IDS = {
  taxEfficiency: "smp_goal_tax1",
  retirementPort: "smp_goal_port",
  emergencyFund: "smp_goal_emrg",
  studentLoans: "smp_goal_loan",
  familyTrust: "smp_goal_trst",
};

const SIGNAL_IDS = {
  taxLossHarvest: "smp_sig_tlh1",
  backdoorRoth: "smp_sig_bdr1",
  rebalanceNeeded: "smp_sig_reb1",
  intlExposureGap: "smp_sig_intl",
  dividendOptimize: "smp_sig_dvd1",
  expenseRatio: "smp_sig_exp1",
  emergencyTarget: "smp_sig_emt1",
  biweeklyPayment: "smp_sig_bwp1",
  trustRecommend: "smp_sig_trt1",
  beneficiaryGaps: "smp_sig_ben1",
  plan529Impact: "smp_sig_529i",
  charitableGiving: "smp_sig_chg1",
};

const DOC_IDS = {
  taxReturn: "smp_doc_txrt",
  portfolioQ1: "smp_doc_pq1",
  portfolioHoldings: "smp_doc_phld",
  familyBudget: "smp_doc_fbdg",
  estateChecklist: "smp_doc_estc",
  loanStatements: "smp_doc_lnst",
  homeInsurance: "smp_doc_hins",
  plan529Compare: "smp_doc_529c",
  w2Alex: "smp_doc_w2ax",
};

const MEMORY_IDS = {
  incomeAlex: "smp_mem_inca",
  incomeSarah: "smp_mem_incs",
  filingStatus: "smp_mem_fils",
  stateRes: "smp_mem_stat",
  match401k: "smp_mem_401k",
  emergencyBal: "smp_mem_embx",
  mortgageBal: "smp_mem_mrtg",
  mortgageRate: "smp_mem_mrtr",
  dependents: "smp_mem_deps",
  employerAlex: "smp_mem_empa",
  homeValue: "smp_mem_homv",
  healthIns: "smp_mem_hlth",
  portfolioValue: "smp_mem_ptfv",
  brokerageAcct: "smp_mem_brkg",
  choseRoth: "smp_mem_roth",
  hysaDecision: "smp_mem_hysa",
  taxLossHarvest: "smp_mem_tlhd",
  plan529Utah: "smp_mem_529u",
  keepMortgage: "smp_mem_kmtg",
  revocableTrust: "smp_mem_rvtd",
  indexFundStrategy: "smp_mem_idxs",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function toolPart(toolName: string, toolCallId: string, input: unknown, output: unknown) {
  return {
    type: `tool-${toolName}` as const,
    toolCallId,
    state: "output-available" as const,
    input,
    output,
  };
}

function assistantWithTools(
  id: string,
  parts: (
    | { type: "text"; text: string }
    | ReturnType<typeof toolPart>
  )[],
) {
  return { id, role: "assistant" as const, parts };
}

// ---------------------------------------------------------------------------
// Sample Chats (8) — all 5 agent types + tool chips
// ---------------------------------------------------------------------------

// Chat 1: Tax Advisor — save_memory x2, save_signal
const taxStrategyChat: ChatRecord = {
  id: CHAT_IDS.taxStrategy,
  title: "Annual Tax Strategy Review",
  model: MODEL,
  createdAt: daysAgo(26),
  updatedAt: daysAgo(25),
  messages: [
    msg("tx_u1", "user", "I'd like to review our tax strategy for 2025. Alex earns $195K at Stripe and Sarah earns $85K at Bloom Marketing. We file jointly in California."),
    assistantWithTools("tx_a1", [
      { type: "text", text: "Let me save your income details so I can reference them in future conversations." },
      toolPart("save_memory", "tc_tx1", {
        type: "fact", key: "annual_income_alex", value: "$195,000", category: "income",
        confidence: 0.95,
      }, { success: true, memoryId: MEMORY_IDS.incomeAlex }),
      toolPart("save_memory", "tc_tx2", {
        type: "fact", key: "annual_income_sarah", value: "$85,000", category: "income",
        confidence: 0.95,
      }, { success: true, memoryId: MEMORY_IDS.incomeSarah }),
      { type: "text", text: "I've saved both income figures. At a combined $280K filing jointly in California, here's your tax landscape:\n\n## Federal Tax Bracket Analysis\n- **22% bracket**: Up to $190,750\n- **24% bracket**: $190,750–$364,200 ← you're here\n- **Marginal rate**: 24% federal + 9.3% CA = **33.3% effective marginal rate**\n\n## Key Optimization Opportunities\n\n1. **Max out pre-tax 401(k)**: $23,500 each reduces AGI by $47,000\n2. **HSA contributions**: $8,550 family limit — triple tax advantage\n3. **Tax-loss harvesting**: Review brokerage positions for harvestable losses\n4. **Backdoor Roth IRA**: At your income, direct Roth contributions are phased out — backdoor conversion is the path\n5. **Charitable giving**: Donor-advised fund for bunching deductions\n\nShall I dive deeper into any of these strategies?" },
    ]),
    msg("tx_u2", "user", "Yes, tell me about tax-loss harvesting. I've got about $15,500 in unrealized losses across my brokerage."),
    assistantWithTools("tx_a2", [
      { type: "text", text: "That's a meaningful amount to harvest. Here's the breakdown:\n\n## Tax-Loss Harvesting: $15,500\n\n**Immediate benefit**: $15,500 × 33.3% marginal rate = **~$5,162 in tax savings**\n\n**How it works:**\n1. Sell positions with unrealized losses\n2. Immediately purchase similar-but-not-identical funds (avoid wash sale rule)\n3. Offset $3,000 against ordinary income, carry remainder forward\n\n**Swap suggestions:**\n- Vanguard Total Stock → Schwab Total Stock\n- S&P 500 index → Total Market index\n- Individual tech stocks → tech sector ETF\n\n**Important deadlines:**\n- Trades must settle by Dec 31\n- Cannot repurchase \"substantially identical\" securities for 30 days\n\nI'm flagging this for your tax efficiency goal since it directly impacts your tax savings this year." },
      toolPart("save_signal", "tc_tx3", {
        goalId: GOAL_IDS.taxEfficiency,
        summary: "Tax-loss harvesting opportunity: $15,500 in unrealized losses could save ~$5,162 in taxes",
        category: "tax_insight",
        extractedValues: { estimated_tax_savings: 5162 },
      }, { success: true, signalId: SIGNAL_IDS.taxLossHarvest }),
    ]),
    msg("tx_u3", "user", "What about the backdoor Roth? Is that complicated?"),
    msg("tx_a3", "assistant", "The backdoor Roth is straightforward once you know the steps:\n\n## Backdoor Roth IRA Process\n\n1. **Contribute to Traditional IRA**: $7,000 per person (non-deductible at your income)\n2. **Convert to Roth IRA**: Usually next business day\n3. **File Form 8606**: Reports the non-deductible contribution\n\n**Critical requirement**: You must have $0 in existing Traditional IRA balances (the \"pro-rata rule\"). If you have old Traditional IRA money, you'll owe taxes on the conversion proportionally.\n\n**For your situation:**\n- Alex: $7,000 backdoor Roth ✅\n- Sarah: $7,000 backdoor Roth ✅\n- Total: **$14,000/year growing tax-free**\n\n**Over 20 years at 8% returns**: That $14K/year becomes roughly **$640,000 in tax-free retirement funds**.\n\nThe main \"gotcha\" is the pro-rata rule. Do either of you have existing Traditional IRA balances?"),
    msg("tx_u4", "user", "No existing Traditional IRA balances. We should definitely do the backdoor Roth."),
    msg("tx_a4", "assistant", "Since you have zero existing Traditional IRA balances, the backdoor Roth conversion will be completely clean — no pro-rata complications.\n\n## Your 2025 Tax Optimization Plan\n\n| Strategy | Annual Savings | Status |\n|----------|---------------|--------|\n| Max 401(k) × 2 | ~$15,600 | In progress |\n| HSA family | ~$2,845 | Verify eligibility |\n| Backdoor Roth × 2 | Tax-free growth | Ready to execute |\n| Tax-loss harvest | ~$5,162 | Timing market dips |\n| **Total tax savings** | **~$23,600+** | — |\n\n**Next steps:**\n1. Execute backdoor Roth for both Alex and Sarah this month\n2. Verify HSA eligibility with Stripe's health plan\n3. Monitor brokerage for tax-loss harvesting opportunities\n4. Consider donor-advised fund contribution before year-end if itemizing\n\nI'll keep tracking these across your other financial conversations."),
  ] as ChatRecord["messages"],
};

// Chat 2: Portfolio Analyzer — list_goals, update_dashboard, save_signal, save_memory
const portfolioChat: ChatRecord = {
  id: CHAT_IDS.portfolioRebal,
  title: "Portfolio Rebalancing Q1 2025",
  model: MODEL,
  createdAt: daysAgo(20),
  updatedAt: daysAgo(19),
  messages: [
    msg("pt_u1", "user", "I'd like to do a full portfolio review. Here's what we have across all accounts:\n\n**Alex's 401(k) — Vanguard** ($185,000)\n- VFIAX (S&P 500 Index): $120,000\n- VTIVX (Target Retirement 2050): $45,000\n- VBTLX (Total Bond Market): $20,000\n\n**Sarah's 401(k) — Fidelity** ($78,000)\n- FXAIX (Fidelity 500 Index): $55,000\n- FXNAX (Fidelity US Bond): $23,000\n\n**Joint Brokerage — Vanguard** ($95,000)\n- VTI (Total Stock Market ETF): $42,000\n- AAPL: $18,000\n- MSFT: $15,000\n- VXUS (Total International ETF): $12,000\n- Cash: $8,000\n\n**Alex's Roth IRA** ($42,000)\n- VTI: $28,000\n- VXUS: $14,000\n\n**Sarah's Roth IRA** ($20,000)\n- VTI: $14,000\n- QQQ (Nasdaq 100 ETF): $6,000\n\nTotal: ~$420,000. Our target is 65% US / 20% International / 15% Bonds."),
    assistantWithTools("pt_a1", [
      { type: "text", text: "Excellent — this is a very thorough breakdown. Let me check your goals and save the portfolio details." },
      toolPart("list_goals", "tc_pt1", {}, {
        goals: [
          { id: GOAL_IDS.retirementPort, title: "Retirement Portfolio Optimization", status: "active" },
          { id: GOAL_IDS.taxEfficiency, title: "Maximize Tax Efficiency", status: "active" },
        ],
      }),
      toolPart("save_memory", "tc_pt1b", {
        type: "fact", key: "portfolio_total_value", value: "$420,000 across 5 accounts (Alex 401k $185K, Sarah 401k $78K, Joint Brokerage $95K, Alex Roth $42K, Sarah Roth $20K)",
        category: "accounts", confidence: 0.95,
      }, { success: true, memoryId: MEMORY_IDS.portfolioValue }),
      { type: "text", text: "I've saved your portfolio details. Here's my full analysis:\n\n## Current Allocation vs Target\n\n| Asset Class | Current | Target | Drift | Status |\n|------------|---------|--------|-------|--------|\n| **US Stocks** | $327,600 (78.0%) | $273,000 (65%) | **+13.0%** | Overweight |\n| **International** | $26,000 (6.2%) | $84,000 (20%) | **-13.8%** | Severely underweight |\n| **Bonds** | $43,000 (10.2%) | $63,000 (15%) | **-4.8%** | Underweight |\n| **Individual Stocks** | $15,400 (3.7%) | — | — | Not in target |\n| **Cash** | $8,000 (1.9%) | $0 (0%) | **+1.9%** | Deploy |\n\n## Holdings Breakdown by Account\n\n### Alex's 401(k) — $185,000\n| Fund | Ticker | Amount | Expense Ratio | Role |\n|------|--------|--------|---------------|------|\n| S&P 500 Index | VFIAX | $120,000 | 0.04% | US Large Cap |\n| Target 2050 | VTIVX | $45,000 | 0.14% | Blended (has intl) |\n| Total Bond | VBTLX | $20,000 | 0.05% | Fixed Income |\n\n### Sarah's 401(k) — $78,000\n| Fund | Ticker | Amount | Expense Ratio | Role |\n|------|--------|--------|---------------|------|\n| Fidelity 500 | FXAIX | $55,000 | 0.015% | US Large Cap |\n| Fidelity Bond | FXNAX | $23,000 | 0.025% | Fixed Income |\n\n### Joint Brokerage — $95,000\n| Holding | Ticker | Amount | Notes |\n|---------|--------|--------|-------|\n| Total Stock Market | VTI | $42,000 | Core US |\n| Apple | AAPL | $18,000 | Individual stock |\n| Microsoft | MSFT | $15,000 | Individual stock |\n| Total International | VXUS | $12,000 | Only intl fund |\n| Cash | — | $8,000 | Uninvested |\n\n### Roth IRAs — $62,000 combined\n| Account | Holdings | Total |\n|---------|----------|-------|\n| Alex's Roth | VTI $28K + VXUS $14K | $42,000 |\n| Sarah's Roth | VTI $14K + QQQ $6K | $20,000 |\n\n## Key Issues\n\n1. **International severely underweight at 6.2%** — only VXUS ($12K) + Roth VXUS ($14K) = $26K. VTIVX has ~40% intl so effectively ~$18K more → still only ~10.5%\n2. **Individual stocks (AAPL + MSFT)** at $33K are 7.9% of portfolio — concentrated in tech\n3. **QQQ in Sarah's Roth** adds more tech/growth overlap with VTI\n4. **Cash drag**: $8K earning brokerage sweep rate instead of being invested\n\nShall I build a specific rebalancing plan showing exactly which trades to make in each account?" },
    ]),
    msg("pt_u2", "user", "Yes, give me a step-by-step rebalancing plan. I want to keep AAPL and MSFT for now but not add more."),
    assistantWithTools("pt_a2", [
      { type: "text", text: "Here's your account-by-account rebalancing plan, keeping AAPL and MSFT:\n\n## Rebalancing Plan: 5 Trades\n\n### Trade 1: Deploy Cash → International (Brokerage)\n- **Buy** $8,000 VXUS in joint brokerage\n- Deploys idle cash immediately\n- VXUS goes from $12K → $20K\n\n### Trade 2: Exchange in Alex's 401(k)\n- **Sell** $30,000 VFIAX (S&P 500)\n- **Buy** $20,000 VTIAX (Total International) + $10,000 VBTLX (Total Bond)\n- No tax impact in 401(k)\n- VFIAX: $120K → $90K | VTIAX: $0 → $20K | VBTLX: $20K → $30K\n\n### Trade 3: Exchange in Sarah's 401(k)\n- **Sell** $15,000 FXAIX (Fidelity 500)\n- **Buy** $15,000 FSPSX (Fidelity International Index)\n- No tax impact in 401(k)\n- FXAIX: $55K → $40K | FSPSX: $0 → $15K\n\n### Trade 4: Rebalance Sarah's Roth IRA\n- **Sell** $6,000 QQQ\n- **Buy** $6,000 VXUS\n- No tax impact in Roth\n- Removes QQQ tech overlap, adds international\n\n### Trade 5: Redirect future contributions\n- Alex's 401(k) new contributions → 100% VTIAX until international catches up\n- Sarah's 401(k) new contributions → 100% FSPSX\n- Joint brokerage → all new deposits to VXUS\n\n## Post-Rebalance Allocation\n\n| Asset Class | Before | After | Target | Gap |\n|------------|--------|-------|--------|-----|\n| US Stocks | 78.0% | 64.3% | 65% | -0.7% |\n| International | 6.2% | 18.3% | 20% | -1.7% |\n| Bonds | 10.2% | 14.5% | 15% | -0.5% |\n| Individual Stocks | 7.9% | 7.9% | — | Held |\n| Cash | 1.9% | 0% | 0% | 0% |\n\n**Result**: From 5 trades and 0 tax events, you go from severely imbalanced to within 2% of targets on all asset classes.\n\nUpdating your portfolio dashboard and flagging the rebalance signal." },
      toolPart("update_dashboard", "tc_pt2", {
        goalId: GOAL_IDS.retirementPort,
        values: {
          portfolio_value: 420000,
          us_allocation: 78,
          intl_allocation: 6.2,
          bond_allocation: 10.2,
          num_accounts: 5,
          weighted_expense_ratio: 0.048,
        },
      }, { success: true, updated: 6 }),
      toolPart("save_signal", "tc_pt3", {
        goalId: GOAL_IDS.retirementPort,
        summary: "Portfolio rebalancing needed: 5 trades across 4 accounts to move from 78%/6%/10% to 64%/18%/15% allocation with zero tax impact",
        category: "investment_signal",
        extractedValues: { us_allocation: 78, intl_allocation: 6.2, trades_needed: 5 },
      }, { success: true, signalId: SIGNAL_IDS.rebalanceNeeded }),
    ]),
    msg("pt_u3", "user", "What about emerging markets specifically? I feel like I should have some exposure there."),
    msg("pt_a3", "assistant", "Good thinking. VXUS already gives you emerging markets exposure — here's the breakdown:\n\n## What's Inside VXUS (Total International)\n\n| Region | Weight | Exposure |\n|--------|--------|----------|\n| Developed Europe | 38% | UK, Germany, France, Switzerland |\n| Developed Pacific | 25% | Japan, Australia, Hong Kong |\n| Emerging Markets | 25% | China, India, Taiwan, Brazil |\n| Canada | 7% | — |\n| Other | 5% | Middle East, Africa |\n\nSo with $77K in VXUS post-rebalance, you'd have roughly **$19,250 in emerging markets** automatically.\n\n## Do You Need a Separate EM Fund?\n\n**Probably not.** Here's why:\n- VXUS already weights EM at 25% — that's market-cap appropriate\n- A separate VWO or IEMG fund creates tax lot complexity\n- EM has higher volatility (20% vs 15% for developed) without higher long-term returns\n- Adding a tilt requires active monitoring and rebalancing\n\n**Exception**: If you specifically wanted to *overweight* EM (say 8-10% of total portfolio instead of ~5%), then a dedicated VWO position in the brokerage would make sense.\n\nFor now, I'd recommend sticking with VXUS as your single international vehicle. It's simpler, cheaper (0.07% expense ratio), and self-rebalancing across regions.\n\n**One thing to watch**: If China exposure concerns you, note VXUS is currently ~7% China. Some investors prefer to use VXUS + a small AVDV (Avantis International Small Cap Value) position for better diversification."),
    msg("pt_u4", "user", "Good point about VXUS already having EM. Let's stick with the simpler approach. When should I execute these trades?"),
    msg("pt_a4", "assistant", "Here's the optimal execution timeline:\n\n## Execution Calendar\n\n### This Week (Priority)\n1. **Deploy $8K cash → VXUS** in brokerage (5 min, market order)\n2. **Exchange in Alex's 401(k)**: VFIAX → VTIAX + VBTLX (10 min, no settlement delay)\n3. **Exchange in Sarah's 401(k)**: FXAIX → FSPSX (10 min)\n\n### Within 2 Weeks\n4. **Sell QQQ → Buy VXUS** in Sarah's Roth (5 min, wait for settlement T+1)\n5. **Update contribution elections** in both 401(k) plans\n\n## Why Execute Quickly\n\n- The 401(k) exchanges are **instant and tax-free** — no reason to wait\n- Cash drag costs you ~$1/day in opportunity cost at current market rates\n- The longer international stays underweight, the more concentrated your US risk\n\n## After Rebalancing\n\nSet a **quarterly review reminder** (April 1, July 1, October 1). If any asset class drifts more than 5% from target, rebalance. With this 5-trade plan, you shouldn't need to touch anything for 3-6 months.\n\nI'll track the allocation in your portfolio goal dashboard and alert you when it's time to rebalance again."),
  ] as ChatRecord["messages"],
};

// Chat 2b: Portfolio Analyzer — list_memories, update_dashboard, save_signal
const portfolioPerfChat: ChatRecord = {
  id: CHAT_IDS.portfolioPerf,
  title: "Portfolio Performance & Cost Analysis",
  model: MODEL,
  createdAt: daysAgo(15),
  updatedAt: daysAgo(14),
  messages: [
    msg("pp_u1", "user", "Can you analyze the performance and costs of our portfolio? I want to make sure we're not paying too much in fees."),
    assistantWithTools("pp_a1", [
      { type: "text", text: "Let me pull up your saved portfolio data to run the analysis." },
      toolPart("list_memories", "tc_pp1", { type: "fact", category: "accounts" }, {
        memories: [
          { key: "portfolio_total_value", value: "$420,000 across 5 accounts" },
          { key: "employer_401k_match", value: "50% up to 6% of salary" },
          { key: "emergency_fund_balance", value: "$41,500" },
        ],
      }),
      { type: "text", text: "Here's a comprehensive cost and performance analysis of your $420K portfolio:\n\n## Expense Ratio Analysis by Fund\n\n| Fund | Ticker | Balance | Expense Ratio | Annual Cost |\n|------|--------|---------|---------------|-------------|\n| Vanguard S&P 500 | VFIAX | $120,000 | 0.04% | $48 |\n| Vanguard Target 2050 | VTIVX | $45,000 | 0.14% | $63 |\n| Vanguard Total Bond | VBTLX | $20,000 | 0.05% | $10 |\n| Fidelity 500 Index | FXAIX | $55,000 | 0.015% | $8 |\n| Fidelity US Bond | FXNAX | $23,000 | 0.025% | $6 |\n| Vanguard Total Stock | VTI | $84,000 | 0.03% | $25 |\n| Vanguard Total Intl | VXUS | $26,000 | 0.07% | $18 |\n| Invesco QQQ | QQQ | $6,000 | 0.20% | $12 |\n| Apple | AAPL | $18,000 | — | $0 |\n| Microsoft | MSFT | $15,000 | — | $0 |\n| Cash | — | $8,000 | — | $0 |\n\n## Cost Summary\n\n| Metric | Value |\n|--------|-------|\n| **Total annual fees** | **$190** |\n| **Weighted avg expense ratio** | **0.048%** |\n| **Industry average (managed)** | 0.50%-1.00% |\n| **Annual savings vs avg managed** | **$1,910-$4,010** |\n\n**Your portfolio costs are excellent** — you're paying $190/year on $420K, which is 96% cheaper than the average actively managed portfolio.\n\n## Performance Attribution (Estimated YTD)\n\n| Component | YTD Return | Contribution |\n|-----------|------------|-------------|\n| US Large Cap (VFIAX/FXAIX/VTI) | +14.2% | +$42,350 |\n| International (VXUS) | +8.1% | +$2,106 |\n| Bonds (VBTLX/FXNAX) | +2.8% | +$1,204 |\n| AAPL | +18.5% | +$3,330 |\n| MSFT | +11.2% | +$1,680 |\n| QQQ | +16.8% | +$1,008 |\n| **Total estimated YTD gain** | | **+$51,678 (+12.3%)** |\n\nSolid returns, but the US-heavy tilt is masking underperformance risk if international catches up." },
    ]),
    msg("pp_u2", "user", "The fees look great. What about the VTIVX Target Date fund — should I keep it or switch to individual funds?"),
    assistantWithTools("pp_a2", [
      { type: "text", text: "Great question. Let me compare the Target Date fund vs a DIY approach:\n\n## VTIVX (Target 2050) Deep Dive\n\n**Current allocation inside VTIVX:**\n- 54% US Stocks\n- 36% International Stocks\n- 7% US Bonds\n- 3% International Bonds\n\n**Cost**: 0.14% expense ratio = $63/year on $45K\n\n## DIY Equivalent with Your Existing Funds\n\nYou could replicate VTIVX with:\n- $24,300 VFIAX (54% US) → 0.04% = $10\n- $16,200 VTIAX (36% Intl) → 0.11% = $18\n- $4,500 VBTLX (10% Bonds) → 0.05% = $2\n\n**DIY cost**: $30/year — saving $33/year\n\n## My Recommendation: **Replace VTIVX**\n\n**Reasons to switch:**\n1. **Save $33/year** (small but compounds over time)\n2. **More control** over asset allocation — VTIVX auto-shifts to bonds as you age, but your whole portfolio should be managed holistically\n3. **Avoids overlap** — VTIVX has US stocks that duplicate VFIAX. You're essentially double-counting\n4. **Better tax-loss harvesting** — individual funds can be harvested independently\n\n**Reasons to keep:**\n1. Simplicity — one fund, auto-rebalances\n2. Glide path — automatically gets more conservative\n\nSince you're already actively managing a 5-account portfolio, the added complexity is minimal. I'd recommend selling VTIVX and splitting into VFIAX + VTIAX + VBTLX in Alex's 401(k).\n\nLet me flag the expense ratio opportunity for your portfolio goal." },
      toolPart("update_dashboard", "tc_pp2", {
        goalId: GOAL_IDS.retirementPort,
        values: {
          weighted_expense_ratio: 0.048,
          ytd_return: 12.3,
          annual_fees: 190,
        },
      }, { success: true, updated: 3 }),
      toolPart("save_signal", "tc_pp3", {
        goalId: GOAL_IDS.retirementPort,
        summary: "VTIVX Target Date fund overlap detected: $45K at 0.14% can be replaced with individual funds at 0.04-0.11%, saving $33/year and eliminating allocation overlap",
        category: "investment_signal",
        extractedValues: { weighted_expense_ratio: 0.048, annual_fees: 190 },
      }, { success: true, signalId: SIGNAL_IDS.expenseRatio }),
    ]),
    msg("pp_u3", "user", "What about dividends? How much are we earning and should we reinvest?"),
    assistantWithTools("pp_a3", [
      { type: "text", text: "Here's your dividend analysis:\n\n## Annual Dividend Income Estimate\n\n| Fund/Stock | Balance | Yield | Annual Dividends |\n|-----------|---------|-------|------------------|\n| VFIAX | $120,000 | 1.3% | $1,560 |\n| VTIVX | $45,000 | 1.8% | $810 |\n| VBTLX | $20,000 | 3.4% | $680 |\n| FXAIX | $55,000 | 1.3% | $715 |\n| FXNAX | $23,000 | 3.2% | $736 |\n| VTI | $84,000 | 1.3% | $1,092 |\n| VXUS | $26,000 | 3.1% | $806 |\n| AAPL | $18,000 | 0.5% | $90 |\n| MSFT | $15,000 | 0.7% | $105 |\n| QQQ | $6,000 | 0.5% | $30 |\n| **Total** | **$412,000** | **1.6% avg** | **$6,624/year** |\n\n## Reinvestment Strategy\n\n**In tax-advantaged accounts (401k, IRA)**: ✅ Always reinvest — no tax consequences\n- Alex's 401(k): ~$3,050/year in dividends → auto-reinvest\n- Sarah's 401(k): ~$1,451/year → auto-reinvest\n- Both Roth IRAs: ~$1,317/year → auto-reinvest\n\n**In taxable brokerage**: Consider **selective reinvestment**\n- VXUS dividends ($806) → reinvest (need more international)\n- VTI dividends ($1,092) → redirect to VXUS until balanced\n- AAPL/MSFT dividends ($195) → accumulate as cash, deploy quarterly\n\n**Tax impact**: In the brokerage, you'll owe taxes on ~$2,093 in dividends:\n- Qualified dividends (most): taxed at 15% = ~$265\n- Ordinary dividends (bonds, REITs): taxed at 24% = ~$48\n- **Total dividend tax**: ~$313/year\n\n**Pro tip**: VXUS pays foreign taxes that generate a **Foreign Tax Credit** on your return — typically $100-150/year. This partially offsets the dividend tax on your international holdings." },
      toolPart("save_signal", "tc_pp4", {
        goalId: GOAL_IDS.retirementPort,
        summary: "Portfolio generates $6,624/year in dividends; brokerage dividends from VTI should be redirected to VXUS to accelerate international rebalancing",
        category: "investment_signal",
        extractedValues: { annual_dividends: 6624 },
      }, { success: true, signalId: SIGNAL_IDS.dividendOptimize }),
    ]),
  ] as ChatRecord["messages"],
};

// Chat 3: Budget Planner — update_dashboard, complete_action_item, update_goal_status
const emergencyDoneChat: ChatRecord = {
  id: CHAT_IDS.emergencyDone,
  title: "Emergency Fund Complete!",
  model: MODEL,
  createdAt: daysAgo(7),
  updatedAt: daysAgo(7),
  messages: [
    msg("em_u1", "user", "Great news! Our emergency fund just hit $41,500 — we actually exceeded our $41,000 target! The HYSA has been earning great interest."),
    assistantWithTools("em_a1", [
      { type: "text", text: "Congratulations! That's a fantastic milestone! You've built a solid 6-month safety net. Let me update your goal dashboard and mark this as complete." },
      toolPart("update_dashboard", "tc_em1", {
        goalId: GOAL_IDS.emergencyFund,
        values: {
          current_balance: 41500,
          months_of_expenses: 6,
          pct_of_target: 101.2,
          completion_date: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
        },
      }, { success: true, updated: 4 }),
      toolPart("complete_action_item", "tc_em2", {
        goalId: GOAL_IDS.emergencyFund,
        actionItemId: "smp_ai_emr4",
      }, { success: true }),
      toolPart("update_goal_status", "tc_em3", {
        goalId: GOAL_IDS.emergencyFund,
        status: "completed",
      }, { success: true }),
      { type: "text", text: "I've updated your emergency fund goal to **completed** status! Here's what this means for your finances:\n\n## What You've Accomplished\n- Built $41,500 safety net (6+ months of expenses)\n- Earning ~$1,868/year in HYSA interest at 4.5% APY\n- Full protection against income disruption\n\n## Next Step: Redirect $1,500/Month\n\nNow that the emergency fund is complete, your $1,500 monthly contribution should be redirected. Here's the priority order:\n\n1. **Max Roth IRA** ($7,000 each = $14,000/year = $1,167/month)\n2. **Additional 401(k)** beyond employer match\n3. **Taxable brokerage** for remaining funds\n\nThis $1,500/month invested at 8% average returns could grow to **$440,000+ over 15 years**.\n\nWant me to set up a new goal for the next savings milestone?" },
    ]),
    msg("em_u2", "user", "That's amazing to see it marked complete. Let's focus the extra $1,500 on maxing out the Roth IRAs first."),
    msg("em_a2", "assistant", "Perfect choice! The Roth IRA gives you tax-free growth and tax-free withdrawals in retirement — hard to beat.\n\n## Roth IRA Funding Plan\n\n| Detail | Amount |\n|--------|--------|\n| Alex's Roth IRA (backdoor) | $7,000 |\n| Sarah's Roth IRA (backdoor) | $7,000 |\n| **Total annual** | **$14,000** |\n| Monthly from emergency fund redirect | $1,167 |\n| Remaining monthly surplus | $333 |\n\n**Timeline**: At $1,167/month, both Roth IRAs will be fully funded in **12 months**.\n\nThe extra $333/month can go toward your student loan payoff or taxable brokerage — whichever aligns with your priorities.\n\nI'll flag this in your tax efficiency goal since the backdoor Roth conversions have tax implications to track."),
  ] as ChatRecord["messages"],
};

// Chat 4: Budget Planner — generate_dashboard, add_action_items, add_insights
const studentLoanChat: ChatRecord = {
  id: CHAT_IDS.studentLoan,
  title: "Student Loan Payoff Options",
  model: MODEL,
  createdAt: daysAgo(18),
  updatedAt: daysAgo(17),
  messages: [
    msg("sl_u1", "user", "Alex still has $42,000 in student loans at 5.5% interest. Should we aggressively pay these off or invest the difference?"),
    assistantWithTools("sl_a1", [
      { type: "text", text: "This is the classic \"pay off debt vs. invest\" decision. Let me set up a dashboard to track your options." },
      toolPart("generate_dashboard", "tc_sl1", {
        goalId: GOAL_IDS.studentLoans,
        schema: [
          { id: "loan_balance", name: "Loan Balance", type: "currency", description: "Remaining student loan balance" },
          { id: "interest_rate", name: "Interest Rate", type: "percent", description: "Current loan interest rate" },
          { id: "monthly_payment", name: "Monthly Payment", type: "currency", description: "Current monthly payment amount" },
          { id: "payoff_date", name: "Payoff Date", type: "date", description: "Projected loan payoff date" },
          { id: "total_interest", name: "Total Interest", type: "currency", description: "Total interest if paid on schedule" },
          { id: "months_remaining", name: "Months Remaining", type: "number", description: "Months until payoff" },
        ],
        values: {
          loan_balance: 42000,
          interest_rate: 5.5,
          monthly_payment: 850,
          payoff_date: "2029-06-15",
          total_interest: 11340,
          months_remaining: 52,
        },
      }, { success: true }),
      { type: "text", text: "Here's the math on both scenarios:\n\n## Scenario A: Aggressive Payoff\n- Add $500/month extra → pay off in **28 months** instead of 52\n- Interest saved: **~$4,200**\n- Guaranteed 5.5% \"return\" on extra payments\n\n## Scenario B: Minimum Payments + Invest Difference\n- Keep $850/month minimum\n- Invest extra $500/month in index funds\n- Expected return: 8-10% (historical average)\n- After 28 months: ~$15,800 invested (vs. $4,200 saved in interest)\n\n## My Recommendation\nAt 5.5%, this is in the \"gray zone\" — not clearly better to pay off or invest. However, given that you're already keeping your 3.875% mortgage (smart), I'd suggest a **hybrid approach**: pay $200 extra/month on the loan and invest $300/month.\n\nThis balances debt reduction with wealth building." },
    ]),
    msg("sl_u2", "user", "I like the hybrid approach. What would that look like over the next 3 years?"),
    assistantWithTools("sl_a2", [
      toolPart("add_action_items", "tc_sl2", {
        goalId: GOAL_IDS.studentLoans,
        items: [
          { text: "Set up automatic $1,050/month payment ($850 minimum + $200 extra)", priority: "high" },
          { text: "Open or fund brokerage account with $300/month auto-invest", priority: "high" },
          { text: "Review loan servicer for potential rate reduction programs", priority: "medium" },
          { text: "Check if employer offers student loan repayment assistance", priority: "medium" },
        ],
      }, { success: true, added: 4 }),
      toolPart("add_insights", "tc_sl3", {
        goalId: GOAL_IDS.studentLoans,
        insights: [
          { text: "Hybrid approach (extra $200/month + $300 invested) optimizes for both debt reduction and wealth building", type: "recommendation" },
          { text: "At 5.5% loan rate vs ~8% market return, investing the spread generates ~$1,800 net gain over 3 years", type: "opportunity" },
          { text: "Student loan interest deduction phases out above $170K MAGI — verify eligibility for partial deduction", type: "warning" },
        ],
      }, { success: true, added: 3 }),
      { type: "text", text: "Here's the 3-year projection with the hybrid approach:\n\n## Hybrid Strategy: 36-Month Outlook\n\n| Metric | Month 12 | Month 24 | Month 36 |\n|--------|----------|----------|----------|\n| Loan balance | $32,400 | $21,600 | $9,400 |\n| Investment balance | $3,800 | $8,200 | $13,100 |\n| Net worth impact | +$13,400 | +$28,600 | +$45,700 |\n\n**Key milestones:**\n- Month 12: Loan under $33K, investments starting to compound\n- Month 24: Loan under $22K, investments > $8K\n- Month 36: Loan nearly gone, investment portfolio established\n- Month ~40: **Loan fully paid off**, then full $1,050 → investments\n\nI've added action items and insights to your student loan goal. The most important next step is setting up the automatic payments." },
    ]),
  ] as ChatRecord["messages"],
};

// Chat 5: Estate Planner — list_memories, save_memory, add_insights
const familyTrustChat: ChatRecord = {
  id: CHAT_IDS.familyTrust,
  title: "Setting Up a Family Trust",
  model: MODEL,
  createdAt: daysAgo(14),
  updatedAt: daysAgo(13),
  messages: [
    msg("tr_u1", "user", "We want to set up a trust to protect our assets and make things easier for the kids if something happens to us. Where do we start?"),
    assistantWithTools("tr_a1", [
      { type: "text", text: "Let me review your saved financial profile to tailor my recommendation." },
      toolPart("list_memories", "tc_tr1", { type: "fact" }, {
        memories: [
          { key: "home_value", value: "$1,100,000" },
          { key: "dependents", value: "2 children: Emma (8), Lucas (5)" },
          { key: "mortgage_balance", value: "$635,000 remaining" },
          { key: "filing_status", value: "Married Filing Jointly" },
        ],
      }),
      { type: "text", text: "Based on your profile — $1.1M home, two young children, and married filing jointly — here's what I recommend:\n\n## Revocable Living Trust\n\nThis is the right vehicle for your situation. Here's why:\n\n**What it does:**\n- Avoids probate (saves 4-7% of estate value in CA — that's $44K-$77K on your home alone)\n- Maintains privacy (probate is public record)\n- Provides seamless management if either spouse becomes incapacitated\n- Names successor trustees to manage assets for Emma and Lucas\n\n**What goes in the trust:**\n- Your home ($1.1M)\n- Investment accounts\n- Bank accounts above a threshold\n- Life insurance policies (as beneficiary)\n\n**What stays out:**\n- 401(k) and IRA accounts (handled by beneficiary designations)\n- Vehicles (unless high value)\n- Day-to-day checking accounts\n\n**Estimated cost**: $2,500-$4,500 for a comprehensive trust package from an estate attorney in the San Jose area.\n\nShall I outline the specific documents you'll need?" },
    ]),
    msg("tr_u2", "user", "Yes, and should both of us be on the trust? What about guardians for the kids?"),
    assistantWithTools("tr_a2", [
      { type: "text", text: "Both of you should be co-trustees, and naming guardians is critical with children ages 5 and 8.\n\n## Trust Structure for the Chen Family\n\n**Co-Trustees**: Alex & Sarah Chen (both manage the trust together)\n**Successor Trustee**: A trusted family member or professional fiduciary\n**Guardians for Emma & Lucas**: Your chosen family member or close friend\n\n## Required Documents Package\n\n1. **Revocable Living Trust** — the core document\n2. **Pour-over Wills** — catches assets not yet titled in the trust\n3. **Durable Powers of Attorney** — financial decisions if incapacitated\n4. **Advance Healthcare Directives** — medical decisions\n5. **Guardian Nominations** — for Emma and Lucas\n6. **Certification of Trust** — summary for banks/title companies\n\n## Age-Based Distribution Schedule\nFor Emma and Lucas, I recommend:\n- Age 25: 1/3 of their share\n- Age 30: 1/2 of remaining\n- Age 35: Full balance\n\nThis prevents a young adult from receiving a large lump sum without financial maturity.\n\n## Important Action Items\n- Choose a guardian (this is often the hardest decision)\n- Select a successor trustee\n- Gather property deeds and account statements\n- Schedule estate attorney consultation" },
      toolPart("save_memory", "tc_tr2", {
        type: "decision", key: "revocable_living_trust",
        value: "Establishing revocable living trust for both spouses with age-based distribution for children",
        category: "general", confidence: 0.85,
      }, { success: true, memoryId: MEMORY_IDS.revocableTrust }),
      toolPart("add_insights", "tc_tr3", {
        goalId: GOAL_IDS.familyTrust,
        insights: [
          { text: "California probate costs 4-7% of estate — trust avoids $44K-$77K in fees on the home alone", type: "opportunity" },
          { text: "Beneficiary designations on 401(k)/IRA accounts must be updated to align with trust structure", type: "warning" },
        ],
      }, { success: true, added: 2 }),
    ]),
  ] as ChatRecord["messages"],
};

// Chat 6: Generalist — save_memory
const collegeSavingsChat: ChatRecord = {
  id: CHAT_IDS.collegeSavings,
  title: "529 College Savings Plan",
  model: MODEL,
  createdAt: daysAgo(22),
  updatedAt: daysAgo(21),
  messages: [
    msg("cs_u1", "user", "With Emma at 8 and Lucas at 5, should we start 529 plans for college savings? What state plan should we use?"),
    assistantWithTools("cs_a1", [
      { type: "text", text: "Absolutely — starting now gives you 10-13 years of tax-free compounding. Here's the plan comparison:\n\n## 529 Plan: State Comparison\n\n| Factor | California ScholarShare | Utah my529 | Nevada Vanguard |\n|--------|----------------------|-----------|----------------|\n| State tax deduction | None (CA doesn't offer) | None for non-residents | None |\n| Investment options | 19 portfolios | 13 portfolios | Vanguard funds |\n| Expense ratio | 0.08%-0.44% | 0.10%-0.29% | 0.13%-0.16% |\n| Morningstar rating | Silver | Gold | Gold |\n\n**My recommendation: Utah my529**\n\nSince California doesn't offer a state tax deduction for 529 contributions, you're free to choose any state's plan. Utah's my529 consistently rates as one of the best nationwide:\n- Lowest cost age-based portfolios\n- Vanguard and Dimensional fund options\n- Gold Morningstar rating\n- Excellent online interface\n\n## Contribution Strategy\n\n**Target per child**: $150,000-$200,000 by college age (covers 4 years at UC/CSU or private)\n\n| Child | Age | Years to College | Monthly Needed (@7%) |\n|-------|-----|-----------------|---------------------|\n| Emma | 8 | 10 years | $865/month for $150K |\n| Lucas | 5 | 13 years | $590/month for $150K |\n| **Combined** | | | **$1,455/month** |\n\nThat's a significant commitment. An alternative: $500/month total (split between them) gets you to ~$85K each — covers most of a UC education." },
      toolPart("save_memory", "tc_cs1", {
        type: "decision", key: "529_plan_utah",
        value: "Selected Utah my529 plan for both children — best cost/performance for non-CA residents",
        category: "goals", confidence: 0.85,
      }, { success: true, memoryId: MEMORY_IDS.plan529Utah }),
    ]),
    msg("cs_u2", "user", "Let's start with $500/month total — $250 each. We can increase later as the student loans get paid off."),
    msg("cs_a2", "assistant", "Smart approach — start consistent and scale up. Here's your setup checklist:\n\n## 529 Setup: $500/Month Total\n\n**Account 1: Emma Chen**\n- Plan: Utah my529\n- Monthly: $250\n- Investment: Age-based aggressive portfolio (10 years to college)\n- Projected at college: ~$42,500\n\n**Account 2: Lucas Chen**\n- Plan: Utah my529\n- Monthly: $250\n- Investment: Age-based aggressive portfolio (13 years to college)\n- Projected at college: ~$55,000\n\n## Scale-Up Timeline\nOnce student loans are paid off (~40 months), redirect that $1,050/month:\n- Increase 529 contributions to $500 each ($1,000 total)\n- Emma's projected total jumps to ~$85,000\n- Lucas's projected total jumps to ~$110,000\n\n## Setup Steps\n1. Open account at my529.org (10 minutes per child)\n2. Set up automatic monthly contributions of $250 each\n3. Select \"Aggressive Age-Based\" portfolio for both\n4. Name Alex & Sarah as co-owners, children as beneficiaries\n\n**Pro tip**: Grandparents can contribute directly — gift up to $18K/year per grandparent per child without gift tax implications."),
  ] as ChatRecord["messages"],
};

// Chat 7: Generalist — list_documents
const homeInsuranceChat: ChatRecord = {
  id: CHAT_IDS.homeInsurance,
  title: "Home Insurance Coverage Review",
  model: MODEL,
  createdAt: daysAgo(10),
  updatedAt: daysAgo(9),
  messages: [
    msg("hi_u1", "user", "Our home insurance renewal is coming up. I want to make sure we have adequate coverage for our $1.1M home in San Jose."),
    assistantWithTools("hi_a1", [
      { type: "text", text: "Let me check if you've uploaded any existing policy documents." },
      toolPart("list_documents", "tc_hi1", {}, {
        documents: [
          { id: DOC_IDS.homeInsurance, filename: "home-insurance-policy.pdf", mediaType: "application/pdf" },
        ],
      }),
      { type: "text", text: "I see you have your current policy uploaded. For a $1.1M home in San Jose, here are the key coverage areas to review:\n\n## Coverage Checklist\n\n| Coverage Type | Recommended | Why |\n|--------------|-------------|-----|\n| Dwelling | $1,100,000+ | Full replacement cost |\n| Personal property | $275,000 (25% of dwelling) | Contents coverage |\n| Liability | $500,000+ | Lawsuit protection |\n| Umbrella | $1,000,000 | Additional liability layer |\n| Earthquake | Separate policy | Required in CA |\n| Water backup | $25,000+ | Sewer/drain backup |\n\n## San Jose-Specific Considerations\n\n1. **Earthquake coverage**: Not included in standard homeowners — CEA or private policy required\n2. **Wildfire risk**: Check your FAIR plan eligibility if in a high-risk zone\n3. **Flood insurance**: FEMA Zone X typically doesn't require it, but worth reviewing\n4. **Home office**: Alex working from home may need endorsement for equipment\n\n## Cost-Saving Tips\n- Bundle home + auto (10-15% discount)\n- Raise deductible from $1,000 to $2,500 (saves 10-15% on premium)\n- Ask about new construction or renovation credits\n- Install smart home security for additional discounts\n\nWant me to help you compare quotes from multiple carriers?" },
    ]),
    msg("hi_u2", "user", "Good point about earthquake insurance. What does that typically cost?"),
    msg("hi_a2", "assistant", "Earthquake insurance in the San Jose area is unfortunately expensive, but it's a critical consideration:\n\n## Earthquake Insurance: San Jose\n\n**CEA (California Earthquake Authority) — Most Common:**\n- Annual premium: **$3,500-$5,500** for a $1.1M home\n- Deductible: 5-25% of dwelling coverage (your choice)\n- At 15% deductible: you cover the first $165,000 of damage\n\n**Private market options:**\n- Companies like Palomar, GeoVera, Arrowhead\n- Sometimes 20-40% cheaper than CEA\n- More flexible deductible options\n- Some cover loss of use (CEA has limited coverage)\n\n## Cost vs. Risk Analysis\n\n| Scenario | CEA (15% ded.) | Self-insure |\n|----------|---------------|-------------|\n| No earthquake | -$4,500/year | $0 |\n| Moderate quake ($100K damage) | You pay $100K (under deductible) | You pay $100K |\n| Major quake ($500K damage) | You pay $165K, CEA pays $335K | You pay $500K |\n| Total loss ($1.1M) | You pay $165K, CEA pays $935K | You pay $1.1M |\n\n**My take**: At your income level, the $4,500/year premium is worth it for catastrophic protection. The deductible is high, but it protects against the scenario that would be financially devastating.\n\nGet quotes from both CEA and at least two private carriers to compare."),
  ] as ChatRecord["messages"],
};

// Chat 8: Generalist — run_background_agent
const yearEndHealthChat: ChatRecord = {
  id: CHAT_IDS.yearEndHealth,
  title: "Year-End Financial Health Check",
  model: MODEL,
  createdAt: daysAgo(2),
  updatedAt: daysAgo(2),
  messages: [
    msg("ye_u1", "user", "Can you run a comprehensive financial health check? I want to see how all our goals and finances are tracking as we head into the end of the year."),
    assistantWithTools("ye_a1", [
      { type: "text", text: "I'll run a deep analysis across all your goals, memories, and financial data using our background agent system. This will take a moment." },
      toolPart("run_background_agent", "tc_ye1", {
        task: "financial_health_check",
        description: "Comprehensive year-end review of all goals, action items, and financial metrics for the Chen family",
      }, {
        success: true,
        summary: "Analysis complete: 5 goals reviewed, 18 memories validated, 10 signals processed, 8 documents referenced",
        findings: [
          "Emergency fund goal completed — $41,500 saved",
          "Tax efficiency on track — $23,600 in projected savings",
          "Portfolio needs rebalancing — international underweight by 12%",
          "Student loan hybrid strategy progressing — 14 months in",
          "Family trust setup pending — attorney consultation needed",
        ],
      }),
      { type: "text", text: "Here's your comprehensive year-end financial health report:\n\n## Chen Family Financial Health Check\n\n### Goal Progress Summary\n\n| Goal | Status | Progress | Grade |\n|------|--------|----------|-------|\n| Emergency Fund | **Completed** | $41,500 / $41,000 | A+ |\n| Tax Efficiency | Active | $23,600 projected savings | A |\n| Portfolio Optimization | Active | Rebalancing needed | B+ |\n| Student Loan Payoff | Paused | $38,200 remaining | B |\n| Family Trust | Active | Planning phase | C+ |\n\n### Key Financial Metrics\n\n| Metric | Value |\n|--------|-------|\n| Combined income | $280,000 |\n| Net worth (est.) | $890,000 |\n| Savings rate | 22% |\n| Debt-to-income | 18% |\n| Emergency coverage | 6+ months |\n\n### Priority Actions for Year-End\n\n1. **Execute tax-loss harvesting** before Dec 31 ($5,162 in savings)\n2. **Complete backdoor Roth conversions** for Alex and Sarah ($14,000)\n3. **Rebalance portfolio** — increase international from 8% to 20%\n4. **Schedule estate attorney** for trust setup\n5. **Review HSA contributions** — verify on track for family max\n\n### Areas of Strength\n- Excellent savings discipline (22% rate)\n- Emergency fund completed ahead of schedule\n- Tax strategy well-optimized for dual-income household\n\n### Areas for Improvement\n- Portfolio too US-concentrated (78% vs 65% target)\n- Trust/estate planning behind schedule\n- Student loan payoff paused — consider resuming extra payments\n\nOverall, you're in a very strong financial position. The biggest wins from here are the portfolio rebalancing and completing the trust setup." },
    ]),
    msg("ye_u2", "user", "This is really helpful. What's the single most impactful thing we should do before year end?"),
    msg("ye_a2", "assistant", "Without question: **execute the tax-loss harvesting + backdoor Roth conversions together**.\n\n## Why This Is #1\n\nThese two moves done together save you the most money with the least effort:\n\n**Tax-loss harvesting ($15,500 in losses):**\n- Saves ~$5,162 in taxes this year\n- Takes 30 minutes to execute\n- Deadline: December 30 (last trading day)\n\n**Backdoor Roth conversions ($14,000 total):**\n- $14K/year growing tax-free forever\n- Takes 15 minutes per account\n- No hard deadline, but best done before year-end for clean accounting\n\n**Combined impact**: $5,162 in immediate tax savings + $14,000 in tax-free compounding = roughly **$19,000 in financial benefit** from about 1 hour of work.\n\n## The 1-Hour Plan\n\n| Step | Time | Account |\n|------|------|---------|\n| 1. Sell loss positions in brokerage | 10 min | Brokerage |\n| 2. Buy replacement funds | 10 min | Brokerage |\n| 3. Contribute $7K to Alex's Traditional IRA | 5 min | Traditional IRA |\n| 4. Convert Alex's Traditional → Roth | 5 min | Roth IRA |\n| 5. Contribute $7K to Sarah's Traditional IRA | 5 min | Traditional IRA |\n| 6. Convert Sarah's Traditional → Roth | 5 min | Roth IRA |\n| 7. Document everything for tax filing | 10 min | Records |\n\nWant me to create a detailed checklist with the specific fund swaps for the tax-loss harvesting?"),
  ] as ChatRecord["messages"],
};

// ---------------------------------------------------------------------------
// Sample Memories (18) — all 9 categories
// ---------------------------------------------------------------------------

const memories: MemoryRecord[] = [
  // Facts (12)
  {
    id: MEMORY_IDS.incomeAlex,
    type: "fact",
    key: "annual_income_alex",
    value: "$195,000",
    category: "income",
    confidence: 0.95,
    source: { chatId: CHAT_IDS.taxStrategy, messageId: "tx_a1", extractedAt: daysAgo(26) },
    createdAt: daysAgo(26),
    updatedAt: daysAgo(26),
  },
  {
    id: MEMORY_IDS.incomeSarah,
    type: "fact",
    key: "annual_income_sarah",
    value: "$85,000",
    category: "income",
    confidence: 0.95,
    source: { chatId: CHAT_IDS.taxStrategy, messageId: "tx_a1", extractedAt: daysAgo(26) },
    createdAt: daysAgo(26),
    updatedAt: daysAgo(26),
  },
  {
    id: MEMORY_IDS.filingStatus,
    type: "fact",
    key: "filing_status",
    value: "Married Filing Jointly",
    category: "tax",
    confidence: 0.9,
    source: { chatId: CHAT_IDS.taxStrategy, messageId: "tx_u1", extractedAt: daysAgo(26) },
    createdAt: daysAgo(26),
    updatedAt: daysAgo(26),
  },
  {
    id: MEMORY_IDS.stateRes,
    type: "fact",
    key: "state_of_residence",
    value: "California",
    category: "tax",
    confidence: 0.9,
    source: { chatId: CHAT_IDS.taxStrategy, messageId: "tx_u1", extractedAt: daysAgo(26) },
    createdAt: daysAgo(26),
    updatedAt: daysAgo(26),
  },
  {
    id: MEMORY_IDS.match401k,
    type: "fact",
    key: "employer_401k_match",
    value: "50% up to 6% of salary",
    category: "accounts",
    confidence: 0.88,
    source: { chatId: CHAT_IDS.taxStrategy, messageId: "tx_a2", extractedAt: daysAgo(25) },
    createdAt: daysAgo(25),
    updatedAt: daysAgo(25),
  },
  {
    id: MEMORY_IDS.emergencyBal,
    type: "fact",
    key: "emergency_fund_balance",
    value: "$41,500",
    category: "accounts",
    confidence: 0.98,
    source: { chatId: CHAT_IDS.emergencyDone, messageId: "em_u1", extractedAt: daysAgo(7) },
    createdAt: daysAgo(15),
    updatedAt: daysAgo(7),
  },
  {
    id: MEMORY_IDS.mortgageBal,
    type: "fact",
    key: "mortgage_balance",
    value: "$635,000 remaining",
    category: "debt",
    confidence: 0.88,
    source: { chatId: CHAT_IDS.studentLoan, messageId: "sl_u1", extractedAt: daysAgo(18) },
    createdAt: daysAgo(18),
    updatedAt: daysAgo(18),
  },
  {
    id: MEMORY_IDS.mortgageRate,
    type: "fact",
    key: "mortgage_rate",
    value: "3.875% fixed, 30-year",
    category: "debt",
    confidence: 0.9,
    source: { chatId: CHAT_IDS.studentLoan, messageId: "sl_a1", extractedAt: daysAgo(18) },
    createdAt: daysAgo(18),
    updatedAt: daysAgo(18),
  },
  {
    id: MEMORY_IDS.dependents,
    type: "fact",
    key: "dependents",
    value: "2 children: Emma (8), Lucas (5)",
    category: "family",
    confidence: 0.95,
    source: { chatId: CHAT_IDS.collegeSavings, messageId: "cs_u1", extractedAt: daysAgo(22) },
    createdAt: daysAgo(22),
    updatedAt: daysAgo(22),
  },
  {
    id: MEMORY_IDS.employerAlex,
    type: "fact",
    key: "employer_alex",
    value: "Stripe, Senior Software Engineer",
    category: "employment",
    confidence: 0.95,
    source: { chatId: CHAT_IDS.taxStrategy, messageId: "tx_u1", extractedAt: daysAgo(26) },
    createdAt: daysAgo(26),
    updatedAt: daysAgo(26),
  },
  {
    id: MEMORY_IDS.homeValue,
    type: "fact",
    key: "home_value",
    value: "$1,100,000",
    category: "property",
    confidence: 0.9,
    source: { chatId: CHAT_IDS.homeInsurance, messageId: "hi_u1", extractedAt: daysAgo(10) },
    createdAt: daysAgo(10),
    updatedAt: daysAgo(10),
  },
  {
    id: MEMORY_IDS.healthIns,
    type: "fact",
    key: "health_insurance",
    value: "Stripe PPO, family plan, HSA-eligible",
    category: "employment",
    confidence: 0.85,
    source: { chatId: CHAT_IDS.taxStrategy, messageId: "tx_a2", extractedAt: daysAgo(25) },
    createdAt: daysAgo(25),
    updatedAt: daysAgo(25),
  },
  {
    id: MEMORY_IDS.portfolioValue,
    type: "fact",
    key: "portfolio_total_value",
    value: "$420,000 across 5 accounts (Alex 401k $185K, Sarah 401k $78K, Joint Brokerage $95K, Alex Roth $42K, Sarah Roth $20K)",
    category: "accounts",
    confidence: 0.95,
    source: { chatId: CHAT_IDS.portfolioRebal, messageId: "pt_a1", extractedAt: daysAgo(19) },
    createdAt: daysAgo(19),
    updatedAt: daysAgo(19),
  },
  {
    id: MEMORY_IDS.brokerageAcct,
    type: "fact",
    key: "brokerage_account",
    value: "Vanguard joint brokerage — VTI $42K, AAPL $18K, MSFT $15K, VXUS $12K, Cash $8K",
    category: "accounts",
    confidence: 0.92,
    source: { chatId: CHAT_IDS.portfolioRebal, messageId: "pt_u1", extractedAt: daysAgo(19) },
    createdAt: daysAgo(19),
    updatedAt: daysAgo(19),
  },
  // Decisions (7)
  {
    id: MEMORY_IDS.choseRoth,
    type: "decision",
    key: "chose_roth_over_traditional",
    value: "Backdoor Roth IRA for tax-free growth — no existing Traditional IRA balances",
    category: "accounts",
    confidence: 0.92,
    source: { chatId: CHAT_IDS.taxStrategy, messageId: "tx_u4", extractedAt: daysAgo(25) },
    context: "At $280K combined income, direct Roth contributions phased out; backdoor conversion clean with zero Traditional IRA balances",
    keywords: ["roth", "ira", "backdoor", "retirement", "tax-free"],
    createdAt: daysAgo(25),
    updatedAt: daysAgo(25),
  },
  {
    id: MEMORY_IDS.hysaDecision,
    type: "decision",
    key: "high_yield_savings",
    value: "Ally HYSA at 4.5% APY for emergency fund",
    category: "accounts",
    confidence: 0.9,
    source: { chatId: CHAT_IDS.emergencyDone, messageId: "em_a2", extractedAt: daysAgo(7) },
    context: "Prioritized instant liquidity and FDIC insurance over T-Bill ladder for emergency reserves",
    keywords: ["emergency", "savings", "hysa", "ally", "liquidity"],
    createdAt: daysAgo(15),
    updatedAt: daysAgo(7),
  },
  {
    id: MEMORY_IDS.taxLossHarvest,
    type: "decision",
    key: "tax_loss_harvest_2024",
    value: "Harvesting $15,500 in losses across index funds and tech positions",
    category: "tax",
    confidence: 0.92,
    source: { chatId: CHAT_IDS.taxStrategy, messageId: "tx_a2", extractedAt: daysAgo(25) },
    context: "Estimated $5,162 in tax savings at 33.3% marginal rate; swapping into similar-but-not-identical funds",
    keywords: ["tax-loss", "harvesting", "capital gains", "wash sale"],
    createdAt: daysAgo(25),
    updatedAt: daysAgo(25),
  },
  {
    id: MEMORY_IDS.plan529Utah,
    type: "decision",
    key: "529_plan_utah",
    value: "Utah my529 for both children — $250/month each",
    category: "goals",
    confidence: 0.85,
    source: { chatId: CHAT_IDS.collegeSavings, messageId: "cs_u2", extractedAt: daysAgo(21) },
    context: "CA offers no 529 state tax deduction; Utah my529 has lowest costs and Gold Morningstar rating",
    keywords: ["529", "college", "education", "utah", "my529"],
    createdAt: daysAgo(21),
    updatedAt: daysAgo(21),
  },
  {
    id: MEMORY_IDS.keepMortgage,
    type: "decision",
    key: "keep_mortgage_invest_difference",
    value: "Keep 3.875% mortgage rate, invest surplus in market",
    category: "debt",
    confidence: 0.88,
    source: { chatId: CHAT_IDS.studentLoan, messageId: "sl_a1", extractedAt: daysAgo(17) },
    context: "At 3.875% fixed rate vs 8-10% expected market returns, investing the spread generates higher long-term wealth",
    keywords: ["mortgage", "invest", "arbitrage", "interest rate"],
    createdAt: daysAgo(17),
    updatedAt: daysAgo(17),
  },
  {
    id: MEMORY_IDS.revocableTrust,
    type: "decision",
    key: "revocable_living_trust",
    value: "Revocable living trust for both spouses with age-based distribution for children",
    category: "general",
    confidence: 0.85,
    source: { chatId: CHAT_IDS.familyTrust, messageId: "tr_a2", extractedAt: daysAgo(13) },
    context: "Avoids CA probate (4-7% of estate), provides privacy, names guardians for Emma and Lucas",
    keywords: ["trust", "estate", "probate", "guardian", "beneficiary"],
    createdAt: daysAgo(13),
    updatedAt: daysAgo(13),
  },
  {
    id: MEMORY_IDS.indexFundStrategy,
    type: "decision",
    key: "index_fund_strategy",
    value: "3-fund portfolio (US total market + international + bonds) using lowest-cost index funds across all accounts",
    category: "accounts",
    confidence: 0.9,
    source: { chatId: CHAT_IDS.portfolioPerf, messageId: "pp_a2", extractedAt: daysAgo(14) },
    context: "Weighted expense ratio of 0.048% saves $1,900-$4,000/year vs actively managed funds; replacing VTIVX target date with individual funds for more control",
    keywords: ["index fund", "three-fund", "vanguard", "fidelity", "expense ratio", "passive"],
    createdAt: daysAgo(14),
    updatedAt: daysAgo(14),
  },
];

// ---------------------------------------------------------------------------
// Sample Goals (5) — all statuses, 5 categories
// ---------------------------------------------------------------------------

// Goal 1: Maximize Tax Efficiency (active, tax)
const taxDashboardSchema: DashboardSchema = [
  { id: "estimated_tax_savings", name: "Estimated Tax Savings", type: "currency", description: "Projected tax savings this year" },
  { id: "effective_tax_rate", name: "Effective Tax Rate", type: "percent", description: "Combined federal + state rate" },
  { id: "tax_strategy_status", name: "Strategy Status", type: "text", description: "Current tax optimization status" },
  { id: "full_match_captured", name: "Full 401(k) Match", type: "boolean", description: "Whether full employer match is captured" },
  { id: "harvested_losses", name: "Harvested Losses", type: "currency", description: "Total tax losses harvested" },
  { id: "backdoor_roth_done", name: "Backdoor Roth Done", type: "boolean", description: "Whether backdoor Roth is completed" },
];

const taxDashboardValues: DashboardValues = {
  estimated_tax_savings: { value: 23600, sourceSignalId: SIGNAL_IDS.taxLossHarvest, updatedAt: daysAgo(25), confidence: 0.88 },
  effective_tax_rate: { value: 33.3, updatedAt: daysAgo(26), confidence: 0.9 },
  tax_strategy_status: { value: "On track — year-end actions pending", updatedAt: daysAgo(2), confidence: 0.85 },
  full_match_captured: { value: true, updatedAt: daysAgo(25), confidence: 0.9 },
  harvested_losses: { value: 15500, sourceSignalId: SIGNAL_IDS.taxLossHarvest, updatedAt: daysAgo(25), confidence: 0.92 },
  backdoor_roth_done: { value: false, updatedAt: daysAgo(25), confidence: 0.95 },
};

const taxActionItems: ActionItem[] = [
  { id: "smp_ai_tx1", text: "Execute tax-loss harvesting trades before Dec 30", completed: false, priority: "high", createdAt: daysAgo(25) },
  { id: "smp_ai_tx2", text: "Complete backdoor Roth conversion for Alex ($7,000)", completed: false, priority: "high", createdAt: daysAgo(25) },
  { id: "smp_ai_tx3", text: "Complete backdoor Roth conversion for Sarah ($7,000)", completed: false, priority: "high", createdAt: daysAgo(25) },
  { id: "smp_ai_tx4", text: "Verify HSA contributions on track for family max ($8,550)", completed: true, priority: "medium", createdAt: daysAgo(24) },
  { id: "smp_ai_tx5", text: "Consider donor-advised fund contribution for charitable deduction", completed: false, priority: "low", createdAt: daysAgo(20) },
];

const taxInsights: Insight[] = [
  { id: "smp_ins_tx1", text: "Tax-loss harvesting + backdoor Roth together save ~$19,000 in 1 hour of work — highest-impact year-end action", type: "recommendation", sourceSignalId: SIGNAL_IDS.taxLossHarvest, createdAt: daysAgo(25) },
  { id: "smp_ins_tx2", text: "At $280K combined income, you're solidly in the 24% federal bracket — every pre-tax dollar saved reduces taxes by 33.3%", type: "opportunity", createdAt: daysAgo(26) },
  { id: "smp_ins_tx3", text: "Student loan interest deduction phases out above $170K MAGI — not available at your income level", type: "warning", sourceSignalId: SIGNAL_IDS.charitableGiving, createdAt: daysAgo(20) },
];

const taxGoal: ChatRecord = {
  id: GOAL_IDS.taxEfficiency,
  title: "Maximize Tax Efficiency",
  model: MODEL,
  createdAt: daysAgo(26),
  updatedAt: daysAgo(2),
  goal: {
    type: "goal",
    description: "Minimize tax liability through strategic use of 401(k), backdoor Roth IRA, HSA contributions, tax-loss harvesting, and charitable giving deductions.",
    status: "active",
    category: "tax",
    signalCount: 3,
    crossPollinate: true,
    origin: "predefined",
    dashboardSchema: taxDashboardSchema,
    dashboardValues: taxDashboardValues,
    actionItems: taxActionItems,
    insights: taxInsights,
  },
  messages: [
    msg("g1_u", "user", "I want to maximize our tax efficiency this year. Combined income is $280K filing jointly in California."),
    msg("g1_a", "assistant", "I'll help you build a comprehensive tax optimization strategy. At $280K MFJ in California, your marginal rate is 33.3% (24% federal + 9.3% state), which means every dollar of deduction saves you 33 cents.\n\nHere's what I'll track for this goal:\n\n1. **Pre-tax contribution maximization** (401(k), HSA)\n2. **Backdoor Roth IRA** execution for both spouses\n3. **Tax-loss harvesting** opportunities in brokerage accounts\n4. **Charitable giving** strategies (donor-advised fund potential)\n5. **Year-end tax planning** actions and deadlines\n\nI'll watch all your financial conversations for signals that affect your tax position and flag opportunities as they arise."),
  ] as ChatRecord["messages"],
};

// Goal 2: Retirement Portfolio Optimization (active, investing)
const portfolioDashboardSchema: DashboardSchema = [
  { id: "portfolio_value", name: "Portfolio Value", type: "currency", description: "Total investment portfolio value across all accounts" },
  { id: "us_allocation", name: "US Stocks", type: "percent", description: "Current US equity allocation" },
  { id: "intl_allocation", name: "International", type: "percent", description: "Current international allocation" },
  { id: "bond_allocation", name: "Bonds", type: "percent", description: "Current bond allocation" },
  { id: "num_accounts", name: "Accounts", type: "number", description: "Number of investment accounts" },
  { id: "weighted_expense_ratio", name: "Avg Expense Ratio", type: "percent", description: "Portfolio-weighted average expense ratio" },
  { id: "annual_fees", name: "Annual Fees", type: "currency", description: "Total annual fund expenses" },
  { id: "annual_dividends", name: "Annual Dividends", type: "currency", description: "Estimated annual dividend income" },
  { id: "ytd_return", name: "YTD Return", type: "percent", description: "Year-to-date investment return" },
  { id: "rebalance_trades", name: "Rebalance Trades", type: "number", description: "Number of trades needed to rebalance" },
];

const portfolioDashboardValues: DashboardValues = {
  portfolio_value: { value: 420000, sourceSignalId: SIGNAL_IDS.rebalanceNeeded, updatedAt: daysAgo(14), confidence: 0.95 },
  us_allocation: { value: 78, sourceSignalId: SIGNAL_IDS.rebalanceNeeded, updatedAt: daysAgo(19), confidence: 0.9 },
  intl_allocation: { value: 6.2, sourceSignalId: SIGNAL_IDS.intlExposureGap, updatedAt: daysAgo(19), confidence: 0.9 },
  bond_allocation: { value: 10.2, updatedAt: daysAgo(19), confidence: 0.9 },
  num_accounts: { value: 5, updatedAt: daysAgo(19), confidence: 1.0 },
  weighted_expense_ratio: { value: 0.048, sourceSignalId: SIGNAL_IDS.expenseRatio, updatedAt: daysAgo(14), confidence: 0.92 },
  annual_fees: { value: 190, sourceSignalId: SIGNAL_IDS.expenseRatio, updatedAt: daysAgo(14), confidence: 0.9 },
  annual_dividends: { value: 6624, sourceSignalId: SIGNAL_IDS.dividendOptimize, updatedAt: daysAgo(14), confidence: 0.85 },
  ytd_return: { value: 12.3, sourceSignalId: SIGNAL_IDS.expenseRatio, updatedAt: daysAgo(14), confidence: 0.85 },
  rebalance_trades: { value: 5, sourceSignalId: SIGNAL_IDS.rebalanceNeeded, updatedAt: daysAgo(19), confidence: 0.88 },
};

const portfolioActionItems: ActionItem[] = [
  { id: "smp_ai_pt1", text: "Deploy $8,000 brokerage cash into VXUS (Total International ETF)", completed: false, priority: "high", createdAt: daysAgo(19) },
  { id: "smp_ai_pt2", text: "Exchange $30K VFIAX → $20K VTIAX + $10K VBTLX in Alex's 401(k)", completed: false, priority: "high", sourceSignalId: SIGNAL_IDS.rebalanceNeeded, createdAt: daysAgo(19) },
  { id: "smp_ai_pt3", text: "Exchange $15K FXAIX → FSPSX in Sarah's 401(k)", completed: false, priority: "high", sourceSignalId: SIGNAL_IDS.rebalanceNeeded, createdAt: daysAgo(19) },
  { id: "smp_ai_pt4", text: "Sell QQQ → Buy VXUS in Sarah's Roth IRA", completed: false, priority: "medium", sourceSignalId: SIGNAL_IDS.intlExposureGap, createdAt: daysAgo(19) },
  { id: "smp_ai_pt5", text: "Replace VTIVX ($45K) with individual VFIAX + VTIAX + VBTLX funds", completed: false, priority: "medium", sourceSignalId: SIGNAL_IDS.expenseRatio, createdAt: daysAgo(14) },
  { id: "smp_ai_pt6", text: "Redirect brokerage VTI dividends to VXUS until international balanced", completed: false, priority: "low", sourceSignalId: SIGNAL_IDS.dividendOptimize, createdAt: daysAgo(14) },
  { id: "smp_ai_pt7", text: "Update 401(k) contribution elections to 100% international funds", completed: false, priority: "medium", createdAt: daysAgo(19) },
];

const portfolioInsights: Insight[] = [
  { id: "smp_ins_pt1", text: "International severely underweight at 6.2% (target 20%) — only $26K of $420K in VXUS. 5 tax-free trades can fix this across 401(k) and Roth accounts", type: "warning", sourceSignalId: SIGNAL_IDS.rebalanceNeeded, createdAt: daysAgo(19) },
  { id: "smp_ins_pt2", text: "VTIVX Target Date fund ($45K at 0.14%) overlaps with existing VFIAX holdings — replacing with individual funds saves $33/year and eliminates double-counting", type: "recommendation", sourceSignalId: SIGNAL_IDS.expenseRatio, createdAt: daysAgo(14) },
  { id: "smp_ins_pt3", text: "Portfolio generates $6,624/year in dividends — redirecting brokerage dividends to VXUS accelerates international rebalancing by $1,092/year", type: "opportunity", sourceSignalId: SIGNAL_IDS.dividendOptimize, createdAt: daysAgo(14) },
  { id: "smp_ins_pt4", text: "Individual stocks (AAPL + MSFT) are 7.9% of portfolio — concentrated tech sector risk. Not urgent but monitor quarterly", type: "warning", sourceSignalId: SIGNAL_IDS.intlExposureGap, createdAt: daysAgo(19) },
  { id: "smp_ins_pt5", text: "529 contributions ($500/month) should be coordinated with portfolio rebalancing to avoid double-counting education investments", type: "missing_info", sourceSignalId: SIGNAL_IDS.plan529Impact, createdAt: daysAgo(20) },
];

const portfolioGoal: ChatRecord = {
  id: GOAL_IDS.retirementPort,
  title: "Retirement Portfolio Optimization",
  model: MODEL,
  createdAt: daysAgo(22),
  updatedAt: daysAgo(19),
  goal: {
    type: "goal",
    description: "Optimize investment portfolio allocation to match target of 65% US / 20% International / 15% Bonds, rebalance quarterly, and maximize tax-efficient placement across accounts.",
    status: "active",
    category: "investing",
    signalCount: 5,
    crossPollinate: true,
    origin: "custom",
    dashboardSchema: portfolioDashboardSchema,
    dashboardValues: portfolioDashboardValues,
    actionItems: portfolioActionItems,
    insights: portfolioInsights,
  },
  messages: [
    msg("g2_u", "user", "I want to optimize our retirement portfolio. Current value is about $420K but the allocation has drifted significantly from our targets."),
    msg("g2_a", "assistant", "I'll help you get your portfolio back on target. With $420K in total investments, even small allocation drifts can mean tens of thousands of dollars in the wrong asset classes.\n\nI'll track:\n1. **Current vs target allocation** across all accounts\n2. **Rebalancing trades** needed and their tax implications\n3. **Tax-efficient placement** (bonds in tax-deferred, stocks in taxable)\n4. **Quarterly rebalancing** reminders and drift alerts\n\nI'll also watch for signals from your other financial conversations — like tax-loss harvesting opportunities that could be used during rebalancing, or cash flow changes that affect contribution targets."),
  ] as ChatRecord["messages"],
};

// Goal 3: Emergency Fund (completed, saving)
const emergencyDashboardSchema: DashboardSchema = [
  { id: "current_balance", name: "Current Balance", type: "currency", description: "Current emergency fund balance" },
  { id: "target_amount", name: "Target Amount", type: "currency", description: "6-month expense target" },
  { id: "months_of_expenses", name: "Months Covered", type: "number", description: "How many months of expenses are covered" },
  { id: "pct_of_target", name: "% of Target", type: "percent", description: "Progress toward goal target" },
  { id: "savings_apy", name: "Savings APY", type: "percent", description: "Current HYSA interest rate" },
  { id: "completion_date", name: "Completion Date", type: "date", description: "Date goal was completed" },
];

const emergencyDashboardValues: DashboardValues = {
  current_balance: { value: 41500, sourceSignalId: SIGNAL_IDS.emergencyTarget, updatedAt: daysAgo(7), confidence: 0.98 },
  target_amount: { value: 41000, updatedAt: daysAgo(28), confidence: 0.95 },
  months_of_expenses: { value: 6, sourceSignalId: SIGNAL_IDS.emergencyTarget, updatedAt: daysAgo(7), confidence: 0.95 },
  pct_of_target: { value: 101.2, sourceSignalId: SIGNAL_IDS.emergencyTarget, updatedAt: daysAgo(7), confidence: 0.98 },
  savings_apy: { value: 4.5, updatedAt: daysAgo(15), confidence: 0.9 },
  completion_date: { value: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10), updatedAt: daysAgo(7), confidence: 1.0 },
};

const emergencyActionItems: ActionItem[] = [
  { id: "smp_ai_emr1", text: "Open high-yield savings account at Ally", completed: true, priority: "high", createdAt: daysAgo(28) },
  { id: "smp_ai_emr2", text: "Set up $1,500 automatic monthly transfer", completed: true, priority: "high", createdAt: daysAgo(28) },
  { id: "smp_ai_emr3", text: "Review and cancel unused subscriptions to accelerate timeline", completed: true, priority: "medium", createdAt: daysAgo(25) },
  { id: "smp_ai_emr4", text: "Reach $41,000 target balance", completed: true, priority: "high", createdAt: daysAgo(28) },
  { id: "smp_ai_emr5", text: "Redirect $1,500/month to Roth IRA after completion", completed: false, priority: "high", createdAt: daysAgo(7) },
];

const emergencyInsights: Insight[] = [
  { id: "smp_ins_em1", text: "Emergency fund completed 2 months ahead of schedule — $500 in interest earned during buildup", type: "opportunity", sourceSignalId: SIGNAL_IDS.emergencyTarget, createdAt: daysAgo(7) },
  { id: "smp_ins_em2", text: "Redirect $1,500/month to backdoor Roth IRA — $14K/year tax-free compounding", type: "recommendation", createdAt: daysAgo(7) },
];

const emergencyFundGoal: ChatRecord = {
  id: GOAL_IDS.emergencyFund,
  title: "Build 6-Month Emergency Fund",
  model: MODEL,
  createdAt: daysAgo(28),
  updatedAt: daysAgo(7),
  goal: {
    type: "goal",
    description: "Accumulate $41,000 in Ally HYSA to cover 6 months of essential household expenses ($6,833/month), providing a financial safety net for the Chen family.",
    status: "completed",
    category: "saving",
    signalCount: 1,
    crossPollinate: true,
    origin: "custom",
    dashboardSchema: emergencyDashboardSchema,
    dashboardValues: emergencyDashboardValues,
    actionItems: emergencyActionItems,
    insights: emergencyInsights,
  },
  messages: [
    msg("g3_u", "user", "I want to build a 6-month emergency fund. We currently have $28,000 and need $41,000 total based on our $6,833/month essential expenses."),
    msg("g3_a", "assistant", "Great goal! With $28,000 saved and a $41,000 target, you need to accumulate $13,000 more.\n\nAt $1,500/month contributions, you'll reach the target in approximately 9 months. I'll track:\n\n1. **Monthly progress** toward the $13,000 gap\n2. **HYSA interest earned** along the way\n3. **Milestone alerts** at 4, 5, and 6-month coverage\n4. **Completion trigger** to redirect savings to Roth IRA\n\nI'll watch your other conversations for budget optimizations that could accelerate the timeline."),
  ] as ChatRecord["messages"],
};

// Goal 4: Student Loan Payoff (paused, debt)
const loanDashboardSchema: DashboardSchema = [
  { id: "loan_balance", name: "Loan Balance", type: "currency", description: "Remaining student loan balance" },
  { id: "interest_rate", name: "Interest Rate", type: "percent", description: "Current loan interest rate" },
  { id: "monthly_payment", name: "Monthly Payment", type: "currency", description: "Current monthly payment" },
  { id: "payoff_date", name: "Payoff Date", type: "date", description: "Projected payoff date" },
  { id: "total_interest_remaining", name: "Remaining Interest", type: "currency", description: "Total interest left to pay" },
  { id: "months_remaining", name: "Months Left", type: "number", description: "Months until payoff" },
];

const loanDashboardValues: DashboardValues = {
  loan_balance: { value: 38200, sourceSignalId: SIGNAL_IDS.biweeklyPayment, updatedAt: daysAgo(17), confidence: 0.9 },
  interest_rate: { value: 5.5, updatedAt: daysAgo(18), confidence: 0.95 },
  monthly_payment: { value: 1050, sourceSignalId: SIGNAL_IDS.biweeklyPayment, updatedAt: daysAgo(17), confidence: 0.9 },
  payoff_date: { value: "2028-08-15", sourceSignalId: SIGNAL_IDS.biweeklyPayment, updatedAt: daysAgo(17), confidence: 0.85 },
  total_interest_remaining: { value: 8400, updatedAt: daysAgo(17), confidence: 0.85 },
  months_remaining: { value: 40, sourceSignalId: SIGNAL_IDS.biweeklyPayment, updatedAt: daysAgo(17), confidence: 0.88 },
};

const loanActionItems: ActionItem[] = [
  { id: "smp_ai_ln1", text: "Set up automatic $1,050/month payment ($850 + $200 extra)", completed: true, priority: "high", createdAt: daysAgo(17) },
  { id: "smp_ai_ln2", text: "Open brokerage account with $300/month auto-invest", completed: true, priority: "high", createdAt: daysAgo(17) },
  { id: "smp_ai_ln3", text: "Review loan servicer for rate reduction programs", completed: false, priority: "medium", createdAt: daysAgo(17) },
  { id: "smp_ai_ln4", text: "Check if Stripe offers student loan repayment assistance", completed: false, priority: "medium", createdAt: daysAgo(17) },
];

const loanInsights: Insight[] = [
  { id: "smp_ins_ln1", text: "Hybrid approach ($200 extra/month + $300 invested) optimizes for both debt reduction and wealth building at 5.5% rate", type: "recommendation", sourceSignalId: SIGNAL_IDS.biweeklyPayment, createdAt: daysAgo(17) },
  { id: "smp_ins_ln2", text: "Investing the spread between 5.5% loan and ~8% market return generates ~$1,800 net gain over 3 years", type: "opportunity", createdAt: daysAgo(17) },
  { id: "smp_ins_ln3", text: "Student loan interest deduction not available at $280K MAGI — no tax benefit to keeping the loan longer", type: "warning", createdAt: daysAgo(16) },
];

const studentLoanGoal: ChatRecord = {
  id: GOAL_IDS.studentLoans,
  title: "Pay Off Student Loans",
  model: MODEL,
  createdAt: daysAgo(18),
  updatedAt: daysAgo(12),
  goal: {
    type: "goal",
    description: "Pay off Alex's $42,000 student loans at 5.5% interest using a hybrid strategy: $200 extra/month toward principal + $300/month invested in index funds.",
    status: "paused",
    category: "debt",
    signalCount: 1,
    crossPollinate: true,
    origin: "custom",
    dashboardSchema: loanDashboardSchema,
    dashboardValues: loanDashboardValues,
    actionItems: loanActionItems,
    insights: loanInsights,
  },
  messages: [
    msg("g4_u", "user", "I want to track paying off Alex's student loans. $42,000 at 5.5% — using the hybrid strategy we discussed."),
    msg("g4_a", "assistant", "I'll track the hybrid payoff strategy. Here's what I'm monitoring:\n\n1. **Loan balance reduction** with $200 extra/month\n2. **Investment balance growth** with $300/month\n3. **Combined net worth impact** of both strategies\n4. **Payoff milestone markers** at $30K, $20K, $10K\n\nThe goal is paused while we prioritize the emergency fund completion and Roth IRA funding. Once those are on track, we'll resume the extra payments.\n\nI'll flag any signals about refinancing opportunities or employer repayment programs."),
  ] as ChatRecord["messages"],
};

// Goal 5: Family Trust (active, estate)
const trustDashboardSchema: DashboardSchema = [
  { id: "trust_type", name: "Trust Type", type: "text", description: "Type of trust being established" },
  { id: "trust_funded", name: "Trust Funded", type: "boolean", description: "Whether assets have been transferred to trust" },
  { id: "documents_completed", name: "Documents Done", type: "number", description: "Number of estate documents completed" },
  { id: "estimated_probate_savings", name: "Probate Savings", type: "currency", description: "Estimated probate cost avoidance" },
  { id: "guardian_named", name: "Guardian Named", type: "boolean", description: "Whether guardian for children is designated" },
  { id: "attorney_consultation", name: "Attorney Status", type: "text", description: "Status of estate attorney engagement" },
];

const trustDashboardValues: DashboardValues = {
  trust_type: { value: "Revocable Living Trust", updatedAt: daysAgo(13), confidence: 0.9 },
  trust_funded: { value: false, updatedAt: daysAgo(13), confidence: 0.95 },
  documents_completed: { value: 0, updatedAt: daysAgo(13), confidence: 0.95 },
  estimated_probate_savings: { value: 55000, sourceSignalId: SIGNAL_IDS.trustRecommend, updatedAt: daysAgo(13), confidence: 0.85 },
  guardian_named: { value: false, sourceSignalId: SIGNAL_IDS.beneficiaryGaps, updatedAt: daysAgo(13), confidence: 0.95 },
  attorney_consultation: { value: "Not yet scheduled", updatedAt: daysAgo(13), confidence: 0.9 },
};

const trustActionItems: ActionItem[] = [
  { id: "smp_ai_tr1", text: "Choose guardian for Emma and Lucas", completed: false, priority: "high", createdAt: daysAgo(13) },
  { id: "smp_ai_tr2", text: "Select successor trustee (family member or professional fiduciary)", completed: false, priority: "high", createdAt: daysAgo(13) },
  { id: "smp_ai_tr3", text: "Schedule estate attorney consultation ($2,500-$4,500 for full package)", completed: false, priority: "high", sourceSignalId: SIGNAL_IDS.trustRecommend, createdAt: daysAgo(13) },
  { id: "smp_ai_tr4", text: "Gather property deeds, account statements, and insurance policies", completed: false, priority: "medium", createdAt: daysAgo(13) },
  { id: "smp_ai_tr5", text: "Review and update beneficiary designations on all retirement accounts", completed: false, priority: "medium", sourceSignalId: SIGNAL_IDS.beneficiaryGaps, createdAt: daysAgo(13) },
];

const trustInsights: Insight[] = [
  { id: "smp_ins_tr1", text: "California probate costs 4-7% of estate — trust saves $44K-$77K on home alone at current $1.1M value", type: "opportunity", sourceSignalId: SIGNAL_IDS.trustRecommend, createdAt: daysAgo(13) },
  { id: "smp_ins_tr2", text: "Beneficiary designations on 401(k)/IRA must align with trust — mismatched designations can override trust terms", type: "warning", sourceSignalId: SIGNAL_IDS.beneficiaryGaps, createdAt: daysAgo(13) },
  { id: "smp_ins_tr3", text: "Age-based distribution schedule (25/30/35) protects children from receiving large sums too early", type: "recommendation", createdAt: daysAgo(13) },
];

const familyTrustGoal: ChatRecord = {
  id: GOAL_IDS.familyTrust,
  title: "Establish Family Trust",
  model: MODEL,
  createdAt: daysAgo(14),
  updatedAt: daysAgo(13),
  goal: {
    type: "goal",
    description: "Establish a revocable living trust for Alex and Sarah Chen to avoid California probate, protect assets for Emma and Lucas, and ensure seamless asset management.",
    status: "active",
    category: "estate",
    signalCount: 2,
    crossPollinate: true,
    origin: "predefined",
    dashboardSchema: trustDashboardSchema,
    dashboardValues: trustDashboardValues,
    actionItems: trustActionItems,
    insights: trustInsights,
  },
  messages: [
    msg("g5_u", "user", "We need to set up a family trust. With a $1.1M home and two young kids, we want to make sure everything is protected."),
    msg("g5_a", "assistant", "Absolutely — at your asset level with young children, a revocable living trust is essential. I'll track the entire process:\n\n1. **Trust structure decisions** (co-trustees, successor, guardians)\n2. **Document completion** (trust, wills, POA, healthcare directives)\n3. **Asset titling** (transferring home, accounts into trust)\n4. **Beneficiary alignment** (retirement accounts match trust terms)\n\nThe biggest decision ahead is choosing guardians for Emma and Lucas. I recommend discussing this with Sarah before your attorney consultation.\n\nI'll watch for signals from your other financial conversations — investment accounts and insurance policies that need to be titled to the trust."),
  ] as ChatRecord["messages"],
};

// ---------------------------------------------------------------------------
// Sample Signals (10) — diverse categories, linking chats to goals
// ---------------------------------------------------------------------------

const signals: SignalRecord[] = [
  {
    id: SIGNAL_IDS.taxLossHarvest,
    goalId: GOAL_IDS.taxEfficiency,
    sourceChatId: CHAT_IDS.taxStrategy,
    sourceMessageId: "tx_a2",
    summary: "Tax-loss harvesting opportunity: $15,500 in unrealized losses could save ~$5,162 in taxes at 33.3% marginal rate.",
    category: "tax_insight",
    createdAt: daysAgo(25),
    extractedValues: { estimated_tax_savings: 5162, harvested_losses: 15500 },
    actionItems: [
      { text: "Execute tax-loss harvest trades before December 30", priority: "high" },
    ],
    insights: [
      { text: "Combining tax-loss harvesting with backdoor Roth conversion maximizes year-end tax benefit", type: "recommendation" },
    ],
  },
  {
    id: SIGNAL_IDS.backdoorRoth,
    goalId: GOAL_IDS.taxEfficiency,
    sourceChatId: CHAT_IDS.taxStrategy,
    sourceMessageId: "tx_a4",
    summary: "Backdoor Roth IRA viable for both spouses — no existing Traditional IRA balances, clean pro-rata calculation.",
    category: "tax_insight",
    createdAt: daysAgo(25),
    extractedValues: { backdoor_roth_done: false },
    actionItems: [
      { text: "Execute backdoor Roth for both Alex and Sarah before year-end", priority: "high" },
    ],
  },
  {
    id: SIGNAL_IDS.rebalanceNeeded,
    goalId: GOAL_IDS.retirementPort,
    sourceChatId: CHAT_IDS.portfolioRebal,
    sourceMessageId: "pt_a2",
    summary: "Portfolio needs rebalancing: US stocks at 78% (target 65%), international at 8% (target 20%). $54,600 in US equity needs reallocation.",
    category: "investment_signal",
    createdAt: daysAgo(19),
    extractedValues: { portfolio_value: 420000, us_allocation: 78, rebalance_trades: 4 },
    actionItems: [
      { text: "Deploy cash position to international funds", priority: "high" },
      { text: "Rebalance within tax-advantaged accounts first", priority: "high" },
    ],
    insights: [
      { text: "Tax-advantaged account rebalancing has no tax consequences — prioritize 401(k)/IRA exchanges", type: "recommendation" },
    ],
  },
  {
    id: SIGNAL_IDS.intlExposureGap,
    goalId: GOAL_IDS.retirementPort,
    sourceChatId: CHAT_IDS.portfolioRebal,
    sourceMessageId: "pt_a1",
    summary: "International exposure at 8% is dangerously below 20% target — concentration risk in US equities.",
    category: "investment_signal",
    createdAt: daysAgo(19),
    extractedValues: { intl_allocation: 8 },
    insights: [
      { text: "Consider VXUS (Total International) which includes 25% emerging markets weighting automatically", type: "recommendation" },
    ],
  },
  {
    id: SIGNAL_IDS.dividendOptimize,
    goalId: GOAL_IDS.retirementPort,
    sourceChatId: CHAT_IDS.portfolioPerf,
    sourceMessageId: "pp_a3",
    summary: "Portfolio generates $6,624/year in dividends. Redirecting brokerage VTI dividends ($1,092) to VXUS accelerates international rebalancing. Foreign Tax Credit from VXUS offsets ~$100-150 in dividend taxes.",
    category: "investment_signal",
    createdAt: daysAgo(14),
    extractedValues: { annual_dividends: 6624 },
    actionItems: [
      { text: "Configure brokerage to redirect VTI dividends to VXUS purchases", priority: "medium" },
    ],
    insights: [
      { text: "Foreign Tax Credit from VXUS partially offsets dividend taxation — claim on Form 1116", type: "opportunity" },
    ],
  },
  {
    id: SIGNAL_IDS.expenseRatio,
    goalId: GOAL_IDS.retirementPort,
    sourceChatId: CHAT_IDS.portfolioPerf,
    sourceMessageId: "pp_a2",
    summary: "VTIVX Target Date fund ($45K at 0.14% ER) overlaps with existing VFIAX holdings. Replacing with individual index funds reduces expenses by $33/year and eliminates allocation double-counting.",
    category: "investment_signal",
    createdAt: daysAgo(14),
    extractedValues: { weighted_expense_ratio: 0.048, annual_fees: 190 },
    actionItems: [
      { text: "Sell VTIVX and split into VFIAX + VTIAX + VBTLX in Alex's 401(k)", priority: "medium" },
    ],
    insights: [
      { text: "Portfolio costs are excellent at 0.048% weighted ER — 96% cheaper than actively managed average of 0.50-1.00%", type: "opportunity" },
    ],
  },
  {
    id: SIGNAL_IDS.emergencyTarget,
    goalId: GOAL_IDS.emergencyFund,
    sourceChatId: CHAT_IDS.emergencyDone,
    sourceMessageId: "em_u1",
    summary: "Emergency fund target reached! $41,500 saved — exceeds $41,000 target by $500. Goal complete.",
    category: "savings_signal",
    createdAt: daysAgo(7),
    extractedValues: { current_balance: 41500, months_of_expenses: 6, pct_of_target: 101.2 },
    actionItems: [
      { text: "Redirect $1,500/month savings to backdoor Roth IRA", priority: "high" },
    ],
    insights: [
      { text: "Completed 2 months ahead of schedule — disciplined saving habit now available for wealth building", type: "opportunity" },
    ],
  },
  {
    id: SIGNAL_IDS.biweeklyPayment,
    goalId: GOAL_IDS.studentLoans,
    sourceChatId: CHAT_IDS.studentLoan,
    sourceMessageId: "sl_a2",
    summary: "Hybrid payoff analysis: $1,050/month ($850 minimum + $200 extra) reduces loan to zero in ~40 months while $300/month invested builds $13,100.",
    category: "budget_update",
    createdAt: daysAgo(17),
    extractedValues: { loan_balance: 38200, monthly_payment: 1050, months_remaining: 40 },
    actionItems: [
      { text: "Set up $1,050 automatic monthly loan payment", priority: "high" },
      { text: "Open brokerage with $300/month auto-invest", priority: "high" },
    ],
  },
  {
    id: SIGNAL_IDS.trustRecommend,
    goalId: GOAL_IDS.familyTrust,
    sourceChatId: CHAT_IDS.familyTrust,
    sourceMessageId: "tr_a1",
    summary: "Revocable living trust recommended for Chen family — avoids CA probate (4-7% of estate), estimated savings of $44K-$77K.",
    category: "estate_planning",
    createdAt: daysAgo(13),
    extractedValues: { estimated_probate_savings: 55000, trust_type: "Revocable Living Trust" },
    actionItems: [
      { text: "Schedule estate attorney consultation in San Jose area ($2,500-$4,500)", priority: "high" },
    ],
    insights: [
      { text: "Probate is public record — trust provides privacy for family assets", type: "opportunity" },
    ],
  },
  {
    id: SIGNAL_IDS.beneficiaryGaps,
    goalId: GOAL_IDS.familyTrust,
    sourceChatId: CHAT_IDS.familyTrust,
    sourceMessageId: "tr_a2",
    summary: "Beneficiary designation gaps identified — 401(k)/IRA designations must align with trust structure or they override trust terms.",
    category: "estate_planning",
    createdAt: daysAgo(13),
    extractedValues: { guardian_named: false },
    actionItems: [
      { text: "Review and update beneficiary designations on all retirement accounts", priority: "high" },
      { text: "Choose guardian for Emma and Lucas", priority: "high" },
    ],
    insights: [
      { text: "Mismatched beneficiary designations are the #1 estate planning mistake — retirement accounts bypass the trust entirely", type: "warning" },
    ],
  },
  {
    id: SIGNAL_IDS.plan529Impact,
    goalId: GOAL_IDS.retirementPort,
    sourceChatId: CHAT_IDS.collegeSavings,
    sourceMessageId: "cs_a1",
    summary: "529 plan contributions ($500/month) should be considered in overall asset allocation — education funds reduce need for aggressive portfolio growth.",
    category: "investment_signal",
    createdAt: daysAgo(21),
    extractedValues: {},
    insights: [
      { text: "529 assets ($500/month) are technically separate from retirement portfolio but affect total wealth allocation", type: "missing_info" },
    ],
  },
  {
    id: SIGNAL_IDS.charitableGiving,
    goalId: GOAL_IDS.taxEfficiency,
    sourceChatId: CHAT_IDS.taxStrategy,
    sourceMessageId: "tx_a4",
    summary: "Charitable giving via donor-advised fund could provide additional tax deduction — bunching strategy for years when itemizing makes sense.",
    category: "tax_insight",
    createdAt: daysAgo(20),
    extractedValues: {},
    insights: [
      { text: "Donor-advised fund allows bunching 2-3 years of charitable giving into one year to exceed standard deduction threshold", type: "opportunity" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Sample Documents (8) — all 5 supported formats
// ---------------------------------------------------------------------------

const documents: DocumentRecord[] = [
  {
    id: DOC_IDS.taxReturn,
    filename: "2024-tax-return-summary.pdf",
    mediaType: "application/pdf",
    chatId: CHAT_IDS.taxStrategy,
    metadata: "2024 Federal Tax Return, Chen Family, MFJ",
    fileSize: 156_000,
    createdAt: daysAgo(26),
  },
  {
    id: DOC_IDS.portfolioQ1,
    filename: "investment-portfolio-q1-2025.xlsx",
    mediaType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    chatId: CHAT_IDS.portfolioRebal,
    metadata: "Q1 2025 Portfolio Summary, All Accounts",
    fileSize: 89_000,
    createdAt: daysAgo(20),
  },
  {
    id: DOC_IDS.portfolioHoldings,
    filename: "portfolio-holdings-detail.csv",
    mediaType: "text/csv",
    chatId: CHAT_IDS.portfolioRebal,
    metadata: "All Holdings by Account, Tickers & Cost Basis",
    fileSize: 18_500,
    createdAt: daysAgo(20),
  },
  {
    id: DOC_IDS.familyBudget,
    filename: "family-budget-2025.xlsx",
    mediaType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    chatId: CHAT_IDS.emergencyDone,
    metadata: "2025 Monthly Budget, Chen Household",
    fileSize: 52_000,
    createdAt: daysAgo(15),
  },
  {
    id: DOC_IDS.estateChecklist,
    filename: "estate-planning-checklist.md",
    mediaType: "text/markdown",
    chatId: CHAT_IDS.familyTrust,
    metadata: "Estate Planning Document Checklist",
    fileSize: 4_200,
    createdAt: daysAgo(14),
  },
  {
    id: DOC_IDS.loanStatements,
    filename: "student-loan-statements.csv",
    mediaType: "text/csv",
    chatId: CHAT_IDS.studentLoan,
    metadata: "Student Loan Payment History, Alex Chen",
    fileSize: 12_000,
    createdAt: daysAgo(18),
  },
  {
    id: DOC_IDS.homeInsurance,
    filename: "home-insurance-policy.pdf",
    mediaType: "application/pdf",
    chatId: CHAT_IDS.homeInsurance,
    metadata: "Homeowners Insurance Policy, San Jose CA",
    fileSize: 234_000,
    createdAt: daysAgo(10),
  },
  {
    id: DOC_IDS.plan529Compare,
    filename: "529-plan-comparison.docx",
    mediaType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    chatId: CHAT_IDS.collegeSavings,
    metadata: "529 Plan Comparison: CA vs UT vs NV",
    fileSize: 67_000,
    createdAt: daysAgo(22),
  },
  {
    id: DOC_IDS.w2Alex,
    filename: "w2-2024-alex.pdf",
    mediaType: "application/pdf",
    chatId: CHAT_IDS.taxStrategy,
    metadata: "W-2 2024, Alex Chen, Stripe Inc",
    fileSize: 45_000,
    createdAt: daysAgo(26),
  },
];

// ---------------------------------------------------------------------------
// Hydration
// ---------------------------------------------------------------------------

export async function loadSampleData(): Promise<void> {
  // Chats (9)
  const chats = [
    taxStrategyChat, portfolioChat, portfolioPerfChat, emergencyDoneChat, studentLoanChat,
    familyTrustChat, collegeSavingsChat, homeInsuranceChat, yearEndHealthChat,
  ];
  for (const chat of chats) {
    await set(`chat:${chat.id}`, chat);
  }

  // Goals (5) — stored as chat: prefix
  const goals = [
    taxGoal, portfolioGoal, emergencyFundGoal, studentLoanGoal, familyTrustGoal,
  ];
  for (const goal of goals) {
    await set(`chat:${goal.id}`, goal);
  }

  // Signals (10)
  for (const signal of signals) {
    await set(`signal:${signal.id}`, signal);
  }

  // Documents (8)
  for (const doc of documents) {
    await set(`doc:${doc.id}`, doc);
  }

  // Memories (18)
  for (const memory of memories) {
    await set(`memory:${memory.id}`, memory);
  }
}
