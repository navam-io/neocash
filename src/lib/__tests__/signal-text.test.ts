import { prepareTextForSignalDetection } from "../signal-text";

const BUDGET = 15_000;
const HEAD_SIZE = 3_000;
const TAIL_SIZE = 4_000;

function makeText(n: number, char = "x"): string {
  return char.repeat(n);
}

describe("prepareTextForSignalDetection", () => {
  it("returns short text unchanged", () => {
    const text = "Short response about taxes.";
    expect(prepareTextForSignalDetection(text)).toBe(text);
  });

  it("returns text at exactly 15K unchanged", () => {
    const text = makeText(BUDGET);
    expect(prepareTextForSignalDetection(text)).toBe(text);
  });

  it("truncates text over 15K", () => {
    const text = makeText(BUDGET + 5000);
    const result = prepareTextForSignalDetection(text);
    expect(result.length).toBeLessThanOrEqual(BUDGET);
  });

  it("preserves head (first 3K chars)", () => {
    const head = "H".repeat(HEAD_SIZE);
    const middle = "M".repeat(10_000);
    const tail = "T".repeat(TAIL_SIZE);
    const text = head + middle + tail;

    const result = prepareTextForSignalDetection(text);
    expect(result.startsWith("H".repeat(HEAD_SIZE))).toBe(true);
  });

  it("preserves tail (last 4K chars)", () => {
    const text = "A".repeat(HEAD_SIZE) + "B".repeat(10_000) + "T".repeat(TAIL_SIZE);
    const result = prepareTextForSignalDetection(text);
    expect(result.endsWith("T".repeat(TAIL_SIZE))).toBe(true);
  });

  it("includes [...] markers in output", () => {
    const text = makeText(BUDGET + 5000);
    const result = prepareTextForSignalDetection(text);
    expect(result).toContain("[...");
  });

  it("scores paragraphs with $ amounts higher than plain text", () => {
    // Build a long text where the middle has some financial paragraphs
    const head = makeText(HEAD_SIZE);
    const plainParagraph = "This is a plain paragraph about nothing special.";
    const dollarParagraph = "Your refund total is $5,234.56 from the $10,000 deduction.";
    // Repeat to fill middle beyond budget
    const middle = (plainParagraph + "\n\n").repeat(200) + dollarParagraph + "\n\n";
    const tail = makeText(TAIL_SIZE);
    const text = head + middle + tail;

    const result = prepareTextForSignalDetection(text);
    // The dollar paragraph should be included in the scored middle
    expect(result).toContain("$5,234.56");
  });

  it("includes paragraphs with % percentages", () => {
    const head = makeText(HEAD_SIZE);
    const percentParagraph = "The effective tax rate is 24.5% on adjusted gross income.";
    const middle = makeText(8000) + "\n\n" + percentParagraph + "\n\n";
    const tail = makeText(TAIL_SIZE);
    const text = head + middle + tail;

    const result = prepareTextForSignalDetection(text);
    expect(result).toContain("24.5%");
  });

  it('uses "[... content truncated ...]" when no scored paragraphs', () => {
    // Middle with no financial content — all plain text with no paragraph breaks
    const text = makeText(BUDGET + 5000);
    const result = prepareTextForSignalDetection(text);
    expect(result).toContain("[... content truncated ...]");
  });

  it("total output is at most 15K chars", () => {
    // Large text with many financial paragraphs
    const head = makeText(HEAD_SIZE);
    const financialParagraphs = Array.from(
      { length: 100 },
      (_, i) => `Total balance: $${i * 1000}.00 with 5.${i}% interest rate`,
    ).join("\n\n");
    const tail = makeText(TAIL_SIZE);
    const text = head + financialParagraphs + tail;

    const result = prepareTextForSignalDetection(text);
    expect(result.length).toBeLessThanOrEqual(BUDGET);
  });
});
