import { resolvePromptYears, promptCategories } from "../prompts";

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
