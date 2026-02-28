import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { prepareTextForSignalDetection } from "@/lib/signal-text";

interface ActionInput {
  id: string;
  goalId: string;
  text: string;
}

export async function POST(req: Request) {
  try {
    const { responseText, actions } = (await req.json()) as {
      responseText: string;
      actions: ActionInput[];
    };

    if (!responseText || !actions || actions.length === 0) {
      return Response.json({ completedIds: [] });
    }

    const truncated = prepareTextForSignalDetection(responseText);

    const actionList = actions
      .map((a) => `- ID: ${a.id} | "${a.text}"`)
      .join("\n");

    const { text } = await generateText({
      model: anthropic("claude-haiku-4-5-20251001"),
      system: `You analyze financial conversation text and determine if any listed action items have been completed, actioned, filed, submitted, or are no longer needed based on the conversation.

Return ONLY a JSON array of action item IDs that are clearly completed. Be conservative — only mark items as complete when the conversation provides strong evidence that the action was taken. Do not mark items as complete based on vague mentions or plans to do them in the future.

Examples of strong evidence:
- "I just filed Form 8606" → mark "File Form 8606" as complete
- "I moved $7,000 into the Roth IRA yesterday" → mark "Contribute $7,000 to Roth IRA" as complete
- "The rebalance is done, sold $12k in BND" → mark "Rebalance bond allocation" as complete

Examples of insufficient evidence:
- "I should file Form 8606 soon" → NOT complete (just a plan)
- "Let me look into the Roth contribution" → NOT complete (just considering)
- "What's the deadline for filing?" → NOT complete (asking about it)

If no actions are clearly completed, return an empty array [].`,
      prompt: `## Pending Action Items\n${actionList}\n\n## Conversation Text\n${truncated}\n\nReturn JSON array of completed action IDs:`,
    });

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return Response.json({ completedIds: [] });
    }

    const completedIds = JSON.parse(jsonMatch[0]);
    // Validate that all returned IDs are strings from our input
    const validIds = new Set(actions.map((a) => a.id));
    const filtered = completedIds.filter(
      (id: unknown) => typeof id === "string" && validIds.has(id),
    );

    return Response.json({ completedIds: filtered });
  } catch (error) {
    console.error("Action completion detection error:", error);
    return Response.json({ completedIds: [] });
  }
}
