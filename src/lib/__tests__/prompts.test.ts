import { resolvePromptYears, promptCategories } from "../prompts";
import { SYSTEM_PROMPT, buildSpecialistSystemPrompt } from "../system-prompt";
import { getAgentProfile } from "../agent-profiles";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 5, 15)); // June 15, 2026
});

afterEach(() => {
  vi.useRealTimers();
});

describe("resolvePromptYears", () => {
  it("replaces {thisYear} with current year", () => {
    expect(resolvePromptYears("File taxes for {thisYear}")).toBe(
      "File taxes for 2026",
    );
  });

  it("replaces {lastYear} with previous year", () => {
    expect(resolvePromptYears("Review {lastYear} returns")).toBe(
      "Review 2025 returns",
    );
  });

  it("replaces {nextYear} with next year", () => {
    expect(resolvePromptYears("Plan for {nextYear}")).toBe("Plan for 2027");
  });

  it("replaces multiple placeholders in one string", () => {
    const input = "Compare {lastYear} to {thisYear}, plan {nextYear}";
    expect(resolvePromptYears(input)).toBe("Compare 2025 to 2026, plan 2027");
  });

  it("returns string unchanged when no placeholders", () => {
    const input = "No placeholders here";
    expect(resolvePromptYears(input)).toBe("No placeholders here");
  });
});

describe("promptCategories", () => {
  it("has 8 categories", () => {
    expect(promptCategories).toHaveLength(8);
  });
});

describe("buildSpecialistSystemPrompt", () => {
  it("returns base prompt for generalist (no extension)", () => {
    const profile = getAgentProfile("generalist");
    const result = buildSpecialistSystemPrompt(profile);
    expect(result).toBe(SYSTEM_PROMPT);
  });

  it("appends specialist extension for tax_advisor", () => {
    const profile = getAgentProfile("tax_advisor");
    const result = buildSpecialistSystemPrompt(profile);
    expect(result).toContain(SYSTEM_PROMPT);
    expect(result).toContain("## Active Specialist: Tax Advisor");
    expect(result).toContain("Tax brackets");
  });

  it("appends specialist extension for portfolio_analyzer", () => {
    const profile = getAgentProfile("portfolio_analyzer");
    const result = buildSpecialistSystemPrompt(profile);
    expect(result).toContain("## Active Specialist: Portfolio Analyzer");
    expect(result).toContain("Asset allocation");
  });

  it("appends specialist extension for budget_planner", () => {
    const profile = getAgentProfile("budget_planner");
    const result = buildSpecialistSystemPrompt(profile);
    expect(result).toContain("## Active Specialist: Budget Planner");
    expect(result).toContain("Cash flow analysis");
  });

  it("appends specialist extension for estate_planner", () => {
    const profile = getAgentProfile("estate_planner");
    const result = buildSpecialistSystemPrompt(profile);
    expect(result).toContain("## Active Specialist: Estate Planner");
    expect(result).toContain("Beneficiary review");
  });

  it("uses goal system prompt when goalContext is provided", () => {
    const profile = getAgentProfile("tax_advisor");
    const result = buildSpecialistSystemPrompt(profile, {
      title: "Maximize Tax Savings",
      goal: {
        type: "goal",
        description: "Reduce tax liability",
        status: "active",
        category: "tax",
        signalCount: 0,
        crossPollinate: true,
      },
      signals: [],
    });
    expect(result).toContain("Maximize Tax Savings");
    expect(result).toContain("## Active Specialist: Tax Advisor");
  });
});
