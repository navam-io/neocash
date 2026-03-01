import { useSyncExternalStore } from "react";
import { subscribe, getSnapshot } from "@/lib/agent-progress-store";

export function useAgentProgress() {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
