import { nanoid } from "nanoid";
import { saveSignal } from "@/hooks/useSignalStore";
import {
  incrementGoalSignals,
  updateDashboardValues,
  addActionItems,
  addInsights,
} from "@/hooks/useGoalStore";
import type { DashboardValues, InsightType } from "@/types";

interface DetectedSignal {
  goalId: string;
  summary: string;
  category: string;
  extractedValues?: Record<string, string | number | boolean>;
  actionItems?: { text: string; priority: "high" | "medium" | "low" }[];
  insights?: { text: string; type: InsightType }[];
}

/**
 * Process detected signals from the detect-signals API.
 * Saves signals, updates dashboard values, adds action items and insights.
 * Returns the number of signals saved.
 */
export async function processDetectedSignals(
  signals: DetectedSignal[],
  sourceChatId: string,
  sourceMessageId: string,
  refreshGoalList?: () => void,
): Promise<number> {
  let count = 0;

  for (const sig of signals) {
    const signalId = nanoid(10);

    // Save the signal record
    await saveSignal({
      id: signalId,
      goalId: sig.goalId,
      sourceChatId,
      sourceMessageId,
      summary: sig.summary,
      category: sig.category,
      createdAt: Date.now(),
      extractedValues: sig.extractedValues,
      actionItems: sig.actionItems,
      insights: sig.insights,
    });

    await incrementGoalSignals(sig.goalId);

    // Apply extracted values to dashboard
    if (sig.extractedValues && Object.keys(sig.extractedValues).length > 0) {
      const dashValues: DashboardValues = {};
      for (const [key, val] of Object.entries(sig.extractedValues)) {
        dashValues[key] = {
          value: val as string | number | boolean,
          sourceSignalId: signalId,
          updatedAt: Date.now(),
        };
      }
      await updateDashboardValues(sig.goalId, dashValues);
    }

    // Add action items to goal
    if (sig.actionItems && sig.actionItems.length > 0) {
      await addActionItems(
        sig.goalId,
        sig.actionItems.map((a) => ({ ...a, sourceSignalId: signalId })),
      );
    }

    // Add insights to goal
    if (sig.insights && sig.insights.length > 0) {
      await addInsights(
        sig.goalId,
        sig.insights.map((i) => ({ ...i, sourceSignalId: signalId })),
      );
    }

    count++;
  }

  if (count > 0 && refreshGoalList) {
    refreshGoalList();
  }

  return count;
}
