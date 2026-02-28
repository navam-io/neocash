import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { prepareTextForSignalDetection } from "@/lib/signal-text";

interface ExistingMemorySummary {
  key: string;
  value: string;
  type: string;
  category: string;
}

export async function POST(req: Request) {
  try {
    const { responseText, existingMemories } = await req.json();

    if (!responseText || responseText.length < 100) {
      return Response.json({ memories: [] });
    }

    const truncated = prepareTextForSignalDetection(responseText);

    const existingList =
      existingMemories && existingMemories.length > 0
        ? `\n\n## Already Known\n${(existingMemories as ExistingMemorySummary[])
            .map((m) => `- ${m.key}: ${m.value} (${m.category})`)
            .join("\n")}`
        : "";

    const { text } = await generateText({
      model: anthropic("claude-haiku-4-5-20251001"),
      system: `You extract personal financial profile facts and key decisions from conversation text. Return ONLY a JSON array.

Each item has:
- "type": "fact" (stable profile data) or "decision" (financial choice made)
- "key": snake_case identifier (e.g. "annual_income", "filing_status", "primary_residence_state")
- "value": human-readable string (e.g. "$180,000", "Married Filing Jointly", "California")
- "category": one of "income", "tax", "accounts", "debt", "family", "employment", "property", "goals", "general"
- "confidence": 0.0-1.0 (how certain you are this is accurate)
- "context": (decisions only) brief rationale, e.g. "Lower current tax bracket makes Roth optimal"
- "keywords": (decisions only) array of related terms for matching, e.g. ["roth", "ira", "retirement", "conversion"]

Rules:
- Be HIGHLY selective. Most responses yield 0-1 memories. Only extract when the user clearly states a fact or decision.
- Do NOT extract hypothetical scenarios, general advice, or things the AI suggested without user confirmation.
- Do NOT re-extract facts that are already known with the same value (listed below).
- For facts: use consistent keys so updates overwrite stale data (e.g. always "annual_income", not "salary" vs "income").
- For decisions: only capture significant financial choices, not minor preferences.
- Confidence: 0.9+ for explicitly stated facts, 0.7-0.9 for inferred from context, skip below 0.7.
- Return [] if nothing qualifies.`,
      prompt: `## Conversation Text\n${truncated}${existingList}\n\nReturn JSON array of extracted memories:`,
    });

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return Response.json({ memories: [] });
    }

    const memories = JSON.parse(jsonMatch[0]);
    return Response.json({ memories });
  } catch (error) {
    console.error("Memory extraction error:", error);
    return Response.json({ memories: [] });
  }
}
