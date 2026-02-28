/**
 * Prepare chat response text for signal detection.
 *
 * Long responses (especially detailed tax/financial calculations) often have
 * their most important summary data at the END — refund totals, effective
 * rates, final balances. A naive `.slice(0, N)` truncation loses exactly
 * the data the dashboard needs. This module uses a smarter strategy:
 *
 * 1. If the text fits the budget, pass through unchanged.
 * 2. Otherwise, keep head (context) + tail (summaries) + the most
 *    financially-dense paragraphs from the middle.
 */

const SIGNAL_TEXT_BUDGET = 15_000;
const HEAD_SIZE = 3_000;
const TAIL_SIZE = 4_000;
const MIDDLE_BUDGET = SIGNAL_TEXT_BUDGET - HEAD_SIZE - TAIL_SIZE; // 8,000

/**
 * Score a paragraph by financial data density.
 * Higher score = more useful for signal extraction.
 */
function scoreFinancialDensity(text: string): number {
  // Dollar amounts like $1,234.56 — strongest signal
  const dollars = (text.match(/\$[\d,]+\.?\d*/g) || []).length;
  // Decimal numbers like 1,234.56 (amounts without $)
  const decimals = (text.match(/\b[\d,]+\.\d{2}\b/g) || []).length;
  // Percentages like 23.1% or 37%
  const percents = (text.match(/\b\d+\.?\d*%/g) || []).length;
  // Table row markers (markdown pipes)
  const pipes = (text.match(/\|/g) || []).length;

  return dollars * 3 + decimals * 2 + percents * 2 + Math.min(pipes, 10);
}

/**
 * Prepare response text for the signal detection API.
 *
 * For short text (≤15K chars): returns as-is.
 * For long text: head + financially-dense middle sections + tail,
 * joined with [...] markers so the LLM knows content was omitted.
 */
export function prepareTextForSignalDetection(text: string): string {
  if (text.length <= SIGNAL_TEXT_BUDGET) return text;

  const head = text.slice(0, HEAD_SIZE);
  const tail = text.slice(-TAIL_SIZE);
  const middle = text.slice(HEAD_SIZE, text.length - TAIL_SIZE);

  // Split middle into paragraphs and score by financial density
  const paragraphs = middle.split(/\n\n+/);
  const scored = paragraphs
    .map((p) => ({ text: p, score: scoreFinancialDensity(p) }))
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score);

  // Greedily select highest-scoring paragraphs within budget
  let middleText = "";
  let remaining = MIDDLE_BUDGET;
  for (const p of scored) {
    const needed = p.text.length + 2; // +2 for \n\n separator
    if (needed > remaining) continue;
    middleText += p.text + "\n\n";
    remaining -= needed;
  }

  if (middleText) {
    return head + "\n\n[...]\n\n" + middleText.trimEnd() + "\n\n[...]\n\n" + tail;
  }

  return head + "\n\n[... content truncated ...]\n\n" + tail;
}
