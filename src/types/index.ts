import type { UIMessage } from "ai";

export type GoalStatus = "active" | "paused" | "completed";

export interface GoalMeta {
  type: "goal";
  description: string;
  status: GoalStatus;
  category?: string;           // matches prompt category ids: "tax", "investing", etc.
  signalCount: number;
  crossPollinate: boolean;     // toggleable per goal (default: true)
  origin?: "custom" | "predefined";  // custom = "+" form, predefined = Goals tab prompt
}

export interface SignalRecord {
  id: string;                  // nanoid(10)
  goalId: string;
  sourceChatId: string;
  sourceMessageId: string;
  summary: string;
  category: string;            // "tax_insight", "investment_signal", etc.
  createdAt: number;
}

export interface ChatRecord {
  id: string;
  title: string;
  messages: UIMessage[];
  model: string;
  createdAt: number;
  updatedAt: number;
  goal?: GoalMeta;             // present only for goal threads
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  provider: string;
}

export interface Prompt {
  title: string;
  text: string;
}

export interface PromptCategory {
  id: string;
  label: string;
  icon: string;
  prompts: Prompt[];
}

export interface DocumentRecord {
  id: string;           // nanoid(10)
  filename: string;     // original filename (dedup key)
  mediaType: string;    // MIME type
  chatId: string;       // associated conversation
  metadata: string;     // AI-generated subtext (initially empty)
  fileSize: number;     // bytes
  createdAt: number;    // timestamp
}
