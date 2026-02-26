import type { PromptCategory } from "@/types";

export const promptCategories: PromptCategory[] = [
  {
    id: "tax",
    label: "Tax Planning",
    icon: "receipt",
    prompts: [
      {
        title: "What tax deductions am I likely missing as a salaried employee?",
        text: "What tax deductions am I likely missing as a salaried employee? I want to make sure I'm taking advantage of every deduction available to me, including home office, education, health savings, and any lesser-known deductions.",
      },
      {
        title: "Explain the difference between traditional and Roth IRA tax benefits",
        text: "Explain the difference between traditional and Roth IRA tax benefits. Help me understand which one makes more sense given different income levels and retirement timelines, with concrete examples of the tax impact.",
      },
      {
        title: "How can I minimize capital gains tax when rebalancing my portfolio?",
        text: "How can I minimize capital gains tax when rebalancing my portfolio? Walk me through strategies like tax-loss harvesting, holding period optimization, and using tax-advantaged accounts for rebalancing.",
      },
      {
        title: "What are the tax implications of selling my home this year?",
        text: "What are the tax implications of selling my home this year? Cover the capital gains exclusion rules, how to calculate my cost basis, and any strategies to reduce the tax burden from the sale.",
      },
      {
        title: "Help me create a year-end tax planning checklist",
        text: "Help me create a comprehensive year-end tax planning checklist. Include items like maximizing retirement contributions, harvesting losses, charitable giving strategies, and any last-minute moves to reduce my tax bill.",
      },
    ],
  },
  {
    id: "investing",
    label: "Investing",
    icon: "trending-up",
    prompts: [
      {
        title: "Build me a diversified ETF portfolio for long-term growth",
        text: "Build me a diversified ETF portfolio for long-term growth. Suggest specific asset classes, allocation percentages, and low-cost ETFs to consider. Assume a 20+ year time horizon with moderate-to-high risk tolerance.",
      },
      {
        title: "Explain dollar-cost averaging and when it makes sense",
        text: "Explain dollar-cost averaging and when it makes sense versus lump-sum investing. Use historical examples to show how each strategy performs in different market conditions.",
      },
      {
        title: "What should I look for when evaluating individual stocks?",
        text: "What should I look for when evaluating individual stocks? Walk me through key financial metrics, qualitative factors, and red flags to watch for when doing fundamental analysis.",
      },
      {
        title: "How do I get started with index fund investing?",
        text: "How do I get started with index fund investing? Explain what index funds are, their advantages over actively managed funds, and give me a step-by-step guide to building a simple index fund portfolio.",
      },
      {
        title: "Compare the risk-return profiles of bonds, stocks, and REITs",
        text: "Compare the risk-return profiles of bonds, stocks, and REITs. Include historical average returns, volatility, correlation with each other, and when each asset class tends to outperform.",
      },
    ],
  },
  {
    id: "portfolio",
    label: "Portfolio",
    icon: "pie-chart",
    prompts: [
      {
        title: "Review my asset allocation for a 30-year-old with moderate risk tolerance",
        text: "Review my asset allocation for a 30-year-old with moderate risk tolerance. Suggest an appropriate mix of stocks, bonds, and alternatives, and explain how this should shift as I get closer to retirement.",
      },
      {
        title: "When should I rebalance my portfolio and how?",
        text: "When should I rebalance my portfolio and how? Compare calendar-based vs. threshold-based rebalancing strategies, and explain the tax implications of each approach.",
      },
      {
        title: "How much international exposure should my portfolio have?",
        text: "How much international exposure should my portfolio have? Discuss the benefits of international diversification, home country bias, and suggest a reasonable allocation for developed and emerging markets.",
      },
      {
        title: "Explain the 3-fund portfolio strategy and its benefits",
        text: "Explain the 3-fund portfolio strategy and its benefits. Walk me through the three components, how to choose specific funds, and why this simple approach often outperforms complex portfolios.",
      },
      {
        title: "What's the role of alternative investments in a balanced portfolio?",
        text: "What's the role of alternative investments in a balanced portfolio? Cover real estate, commodities, private equity, and other alternatives — their potential benefits, risks, and appropriate allocation percentages.",
      },
    ],
  },
  {
    id: "budgeting",
    label: "Budgeting",
    icon: "wallet",
    prompts: [
      {
        title: "Help me create a zero-based budget for my monthly income",
        text: "Help me create a zero-based budget for my monthly income. Explain the zero-based budgeting method and walk me through categorizing every dollar of income into specific spending, saving, and investing categories.",
      },
      {
        title: "What's the 50/30/20 rule and how do I apply it?",
        text: "What's the 50/30/20 rule and how do I apply it to my personal finances? Break down each category with specific examples, and suggest adjustments for high cost-of-living areas or aggressive savings goals.",
      },
      {
        title: "How much should I have in my emergency fund?",
        text: "How much should I have in my emergency fund? Help me determine the right amount based on my situation, where to keep it, and a realistic plan to build it up over time.",
      },
      {
        title: "Strategies to reduce monthly expenses without feeling deprived",
        text: "Strategies to reduce monthly expenses without feeling deprived. Focus on the biggest expense categories like housing, transportation, and food, with practical tips that maintain quality of life.",
      },
      {
        title: "How do I prioritize debt payoff vs. investing?",
        text: "How do I prioritize debt payoff vs. investing? Compare the debt avalanche and snowball methods, explain when it makes sense to invest while carrying debt, and help me create a balanced approach.",
      },
    ],
  },
  {
    id: "neocash",
    label: "NeoCash's choice",
    icon: "sparkles",
    prompts: [
      {
        title: "What's the single most impactful financial habit I can start today?",
        text: "What's the single most impactful financial habit I can start today? I want something actionable that will compound over time and significantly improve my financial health.",
      },
      {
        title: "Explain compound interest with a real example over 30 years",
        text: "Explain compound interest with a real example over 30 years. Show me the math with different contribution amounts and interest rates so I can see how small changes lead to dramatically different outcomes.",
      },
      {
        title: "How do I set up automated finances so I don't have to think about money?",
        text: "How do I set up automated finances so I don't have to think about money? Walk me through automating bill payments, savings transfers, investment contributions, and how to structure accounts for this system.",
      },
      {
        title: "What financial milestones should I hit by age 30, 40, and 50?",
        text: "What financial milestones should I hit by age 30, 40, and 50? Include net worth targets, retirement savings benchmarks, and lifestyle milestones that indicate strong financial health at each stage.",
      },
      {
        title: "Walk me through opening and funding my first brokerage account",
        text: "Walk me through opening and funding my first brokerage account. Cover how to choose a broker, account types, initial deposit, selecting first investments, and common mistakes to avoid as a beginner.",
      },
    ],
  },
  {
    id: "goals",
    label: "Goals",
    icon: "target",
    prompts: [
      {
        title: "Start a tax preparation goal for 2026",
        text: "I want to set a goal to prepare for the 2026 tax season. Help me build a month-by-month checklist of what to gather, deadlines to track, and strategies to maximize my refund or minimize what I owe.",
      },
      {
        title: "Track my portfolio rebalancing progress",
        text: "I want to set a goal to rebalance my portfolio. Help me assess my current allocation, define a target allocation, and create an actionable plan with specific trades and a timeline.",
      },
      {
        title: "Build an emergency fund plan",
        text: "I want to set a goal to build my emergency fund. Help me determine the right target amount based on my expenses, create a savings plan with monthly milestones, and suggest the best accounts to hold it in.",
      },
      {
        title: "Plan my retirement savings strategy",
        text: "I want to set a goal for my retirement savings strategy. Help me evaluate my current retirement accounts, optimize contributions across 401(k)/IRA/Roth, and project my savings growth with different contribution scenarios.",
      },
      {
        title: "Set a debt payoff goal with milestones",
        text: "I want to set a goal to pay off my debt systematically. Help me list all debts, compare avalanche vs snowball strategies, create a payoff timeline with milestones, and find opportunities to accelerate payments.",
      },
    ],
  },
];
