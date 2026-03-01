// ─── SSE Event Types (server → client) ──────────

export interface AgentStartedEvent {
  type: "agent:started";
  taskId: string;
  agentName: string;
  description: string;
  total: number;
}

export interface AgentProgressEvent {
  type: "agent:progress";
  taskId: string;
  agentName: string;
  description: string;
  lastTool?: string;
}

export interface AgentCompletedEvent {
  type: "agent:completed";
  taskId: string;
  agentName: string;
  summary: string;
  durationMs: number;
}

export interface AgentErrorEvent {
  type: "agent:error";
  taskId: string;
  agentName: string;
  summary: string;
}

export interface AgentResultEvent {
  type: "agent:result";
  diffs: unknown;
  summary: string;
  changeCount: number;
  task: string;
}

export interface ConnectionErrorEvent {
  type: "connection_error";
  message: string;
}

export type AgentSSEEvent =
  | AgentStartedEvent
  | AgentProgressEvent
  | AgentCompletedEvent
  | AgentErrorEvent
  | AgentResultEvent
  | ConnectionErrorEvent;

// ─── UI State Types ──────────────────────────────

export type AgentStepStatus = "pending" | "running" | "completed" | "failed";

export interface AgentStep {
  agentName: string;
  status: AgentStepStatus;
  description: string;
  lastTool?: string;
  durationMs?: number;
  summary?: string;
}

export interface AgentProgressState {
  toolCallId: string;
  taskType: string;
  status: "running" | "completed" | "failed";
  steps: AgentStep[];
  startedAt: number;
  elapsedMs: number;
}
