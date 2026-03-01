import type {
  AgentProgressState,
  AgentSSEEvent,
  AgentStep,
} from "@/lib/agent-progress-types";

// ─── Module-level reactive store ─────────────────
// Used via useSyncExternalStore so React components
// re-render when progress updates arrive from the
// tool executor's SSE stream.

let state: AgentProgressState | null = null;
let listeners = new Set<() => void>();
let timerHandle: ReturnType<typeof setInterval> | null = null;

function emit() {
  for (const listener of listeners) listener();
}

// ─── Public API ──────────────────────────────────

export function initProgress(
  toolCallId: string,
  taskType: string,
  agentNames: string[],
) {
  const steps: AgentStep[] = agentNames.map((name) => ({
    agentName: name,
    status: "pending",
    description: "",
  }));

  state = {
    toolCallId,
    taskType,
    status: "running",
    steps,
    startedAt: Date.now(),
    elapsedMs: 0,
  };

  // Start elapsed timer (1s tick)
  stopTimer();
  timerHandle = setInterval(() => {
    if (state && state.status === "running") {
      state = { ...state, elapsedMs: Date.now() - state.startedAt };
      emit();
    }
  }, 1000);

  emit();
}

export function updateProgress(event: AgentSSEEvent) {
  if (!state) return;

  switch (event.type) {
    case "agent:started": {
      state = {
        ...state,
        steps: state.steps.map((s) =>
          s.agentName === event.agentName
            ? { ...s, status: "running", description: event.description }
            : s,
        ),
      };
      break;
    }
    case "agent:progress": {
      state = {
        ...state,
        steps: state.steps.map((s) =>
          s.agentName === event.agentName
            ? { ...s, description: event.description, lastTool: event.lastTool }
            : s,
        ),
      };
      break;
    }
    case "agent:completed": {
      state = {
        ...state,
        steps: state.steps.map((s) =>
          s.agentName === event.agentName
            ? {
                ...s,
                status: "completed",
                summary: event.summary,
                durationMs: event.durationMs,
              }
            : s,
        ),
      };
      break;
    }
    case "agent:error": {
      state = {
        ...state,
        steps: state.steps.map((s) =>
          s.agentName === event.agentName
            ? { ...s, status: "failed", summary: event.summary }
            : s,
        ),
      };
      break;
    }
    case "agent:result": {
      state = {
        ...state,
        status: "completed",
        elapsedMs: Date.now() - state.startedAt,
      };
      stopTimer();
      break;
    }
    case "connection_error": {
      state = {
        ...state,
        status: "failed",
        elapsedMs: Date.now() - state.startedAt,
      };
      stopTimer();
      break;
    }
  }

  emit();
}

export function clearProgress() {
  stopTimer();
  state = null;
  emit();
}

// ─── useSyncExternalStore API ────────────────────

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): AgentProgressState | null {
  return state;
}

// ─── Internal ────────────────────────────────────

function stopTimer() {
  if (timerHandle !== null) {
    clearInterval(timerHandle);
    timerHandle = null;
  }
}
