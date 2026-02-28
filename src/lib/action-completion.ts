import { toggleActionItem } from "@/hooks/useGoalStore";

/**
 * Process detected action completions by toggling each completed item.
 * Returns the count of items toggled.
 */
export async function processDetectedCompletions(
  completedIds: string[],
  actionGoalMap: Map<string, string>,
): Promise<number> {
  let count = 0;
  for (const actionId of completedIds) {
    const goalId = actionGoalMap.get(actionId);
    if (goalId) {
      await toggleActionItem(goalId, actionId);
      count++;
    }
  }
  return count;
}
