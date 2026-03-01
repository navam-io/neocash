import { classifyByKeywords } from "../agent-router";

describe("agent-router", () => {
  describe("classifyByKeywords (Tier 3)", () => {
    describe("tax_advisor", () => {
      it("classifies tax deduction questions", () => {
        expect(classifyByKeywords("What tax deductions can I claim as a freelancer?")).toBe("tax_advisor");
      });

      it("classifies IRS-related questions", () => {
        expect(classifyByKeywords("How do I handle my 1099 income for taxes?")).toBe("tax_advisor");
      });

      it("classifies capital gains questions", () => {
        expect(classifyByKeywords("What are the capital gains tax brackets?")).toBe("tax_advisor");
      });

      it("classifies HSA/401k tax questions", () => {
        expect(classifyByKeywords("Should I max out my HSA or 401k for tax savings?")).toBe("tax_advisor");
      });
    });

    describe("portfolio_analyzer", () => {
      it("classifies portfolio rebalancing questions", () => {
        expect(classifyByKeywords("Should I rebalance my 60/40 portfolio?")).toBe("portfolio_analyzer");
      });

      it("classifies asset allocation questions", () => {
        expect(classifyByKeywords("What should my asset allocation look like?")).toBe("portfolio_analyzer");
      });

      it("classifies ETF/index fund questions", () => {
        expect(classifyByKeywords("Which index fund has the lowest expense ratio?")).toBe("portfolio_analyzer");
      });

      it("classifies diversification questions", () => {
        expect(classifyByKeywords("How can I diversify my stock investments?")).toBe("portfolio_analyzer");
      });
    });

    describe("budget_planner", () => {
      it("classifies debt payoff questions", () => {
        expect(classifyByKeywords("How can I pay off $15K in credit card debt?")).toBe("budget_planner");
      });

      it("classifies budget questions", () => {
        expect(classifyByKeywords("Help me create a budget for my expenses")).toBe("budget_planner");
      });

      it("classifies savings questions", () => {
        expect(classifyByKeywords("How much should I put into my emergency fund?")).toBe("budget_planner");
      });

      it("classifies spending questions", () => {
        expect(classifyByKeywords("How can I reduce my monthly spending on groceries and subscriptions?")).toBe("budget_planner");
      });
    });

    describe("estate_planner", () => {
      it("classifies trust questions", () => {
        expect(classifyByKeywords("Do I need a living trust?")).toBe("estate_planner");
      });

      it("classifies beneficiary questions", () => {
        expect(classifyByKeywords("How should I set up beneficiaries and inheritance for my estate?")).toBe("estate_planner");
      });

      it("classifies estate tax questions", () => {
        expect(classifyByKeywords("What is the current estate tax threshold?")).toBe("estate_planner");
      });

      it("classifies will/probate questions", () => {
        expect(classifyByKeywords("Do I need a will to avoid probate?")).toBe("estate_planner");
      });
    });

    describe("generalist fallback", () => {
      it("returns generalist for generic financial questions", () => {
        expect(classifyByKeywords("What should I know about money?")).toBe("generalist");
      });

      it("returns generalist for empty messages", () => {
        expect(classifyByKeywords("")).toBe("generalist");
      });

      it("returns generalist for greetings", () => {
        expect(classifyByKeywords("Hello, how are you?")).toBe("generalist");
      });

      it("returns generalist for ambiguous messages", () => {
        expect(classifyByKeywords("Tell me about financial planning in general")).toBe("generalist");
      });

      it("returns generalist when keyword score is below threshold", () => {
        // Only one weak keyword match — below threshold of 2
        expect(classifyByKeywords("What should I know about this?")).toBe("generalist");
      });
    });

    describe("edge cases", () => {
      it("handles mixed-case input", () => {
        expect(classifyByKeywords("MY TAX DEDUCTIONS ARE COMPLEX")).toBe("tax_advisor");
      });

      it("handles punctuation in input", () => {
        expect(classifyByKeywords("What about my portfolio? Any rebalancing needed?")).toBe("portfolio_analyzer");
      });

      it("picks strongest match when multiple domains overlap", () => {
        // "tax" is one hit for tax_advisor, but "budget" + "expenses" + "spending" = 3 hits for budget_planner
        const result = classifyByKeywords("Help me budget my expenses and reduce spending for tax purposes");
        expect(result).toBe("budget_planner");
      });
    });
  });
});
