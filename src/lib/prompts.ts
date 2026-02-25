import type { PromptCategory } from "@/types";

export const promptCategories: PromptCategory[] = [
  {
    id: "tax",
    label: "Tax Planning",
    icon: "receipt",
    prompts: [
      "What tax deductions am I likely missing as a salaried employee?",
      "Explain the difference between traditional and Roth IRA tax benefits",
      "How can I minimize capital gains tax when rebalancing my portfolio?",
      "What are the tax implications of selling my home this year?",
      "Help me create a year-end tax planning checklist",
    ],
  },
  {
    id: "investing",
    label: "Investing",
    icon: "trending-up",
    prompts: [
      "Build me a diversified ETF portfolio for long-term growth",
      "Explain dollar-cost averaging and when it makes sense",
      "What should I look for when evaluating individual stocks?",
      "How do I get started with index fund investing?",
      "Compare the risk-return profiles of bonds, stocks, and REITs",
    ],
  },
  {
    id: "portfolio",
    label: "Portfolio",
    icon: "pie-chart",
    prompts: [
      "Review my asset allocation for a 30-year-old with moderate risk tolerance",
      "When should I rebalance my portfolio and how?",
      "How much international exposure should my portfolio have?",
      "Explain the 3-fund portfolio strategy and its benefits",
      "What's the role of alternative investments in a balanced portfolio?",
    ],
  },
  {
    id: "budgeting",
    label: "Budgeting",
    icon: "wallet",
    prompts: [
      "Help me create a zero-based budget for my monthly income",
      "What's the 50/30/20 rule and how do I apply it?",
      "How much should I have in my emergency fund?",
      "Strategies to reduce monthly expenses without feeling deprived",
      "How do I prioritize debt payoff vs. investing?",
    ],
  },
  {
    id: "neocash",
    label: "NeoCash's choice",
    icon: "sparkles",
    prompts: [
      "What's the single most impactful financial habit I can start today?",
      "Explain compound interest with a real example over 30 years",
      "How do I set up automated finances so I don't have to think about money?",
      "What financial milestones should I hit by age 30, 40, and 50?",
      "Walk me through opening and funding my first brokerage account",
    ],
  },
];
