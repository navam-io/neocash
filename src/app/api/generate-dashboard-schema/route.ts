import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

export async function POST(req: Request) {
  try {
    const { title, description, category } = await req.json();

    if (!title) {
      return Response.json({ error: "Title is required" }, { status: 400 });
    }

    const currentYear = new Date().getFullYear();

    const { text } = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      system: `You generate dashboard schemas for personal wealth management goals. Given a goal title, description, and optional category, return a JSON array of 3-8 typed attributes that a user would want to track for this goal.

Each attribute must have:
- id: short snake_case identifier (e.g. "total_income", "filing_deadline")
- name: human-readable display name (e.g. "Total Income", "Filing Deadline")
- type: one of "currency", "percent", "date", "text", "boolean", "number"
- description: one-sentence explanation of what this tracks

Choose types carefully:
- "currency" for dollar amounts (income, expenses, savings, refunds)
- "percent" for rates and percentages (tax rate, savings rate, returns)
- "date" for deadlines and milestones
- "text" for status descriptions and short notes
- "boolean" for yes/no completion flags (e.g. "Documents Gathered")
- "number" for counts and quantities

Examples:

Goal: "Prepare for Tax Season ${currentYear}"
[
  {"id":"total_income","name":"Total Income","type":"currency","description":"Combined W-2 and 1099 income for the tax year"},
  {"id":"tax_withheld","name":"Tax Withheld","type":"currency","description":"Total federal and state tax already withheld"},
  {"id":"estimated_refund","name":"Estimated Refund","type":"currency","description":"Projected refund or amount owed"},
  {"id":"filing_deadline","name":"Filing Deadline","type":"date","description":"Tax return due date"},
  {"id":"documents_gathered","name":"Documents Gathered","type":"boolean","description":"Whether all required tax documents have been collected"},
  {"id":"effective_tax_rate","name":"Effective Tax Rate","type":"percent","description":"Total tax as a percentage of gross income"}
]

Goal: "Build Emergency Fund"
[
  {"id":"target_amount","name":"Target Amount","type":"currency","description":"Goal amount for the emergency fund (typically 3-6 months expenses)"},
  {"id":"current_balance","name":"Current Balance","type":"currency","description":"Amount saved so far"},
  {"id":"monthly_contribution","name":"Monthly Contribution","type":"currency","description":"Amount being saved each month"},
  {"id":"completion_percent","name":"Progress","type":"percent","description":"Percentage of target amount reached"},
  {"id":"target_date","name":"Target Date","type":"date","description":"Expected date to reach the full target"}
]

Return ONLY the JSON array, no explanation or markdown.`,
      prompt: `Goal: "${title}"${description && description !== title ? `\nDescription: ${description}` : ""}${category ? `\nCategory: ${category}` : ""}`,
    });

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return Response.json({ schema: [] });
    }

    const schema = JSON.parse(jsonMatch[0]);
    return Response.json({ schema });
  } catch (error) {
    console.error("Dashboard schema generation error:", error);
    return Response.json(
      { error: "Failed to generate schema" },
      { status: 500 },
    );
  }
}
