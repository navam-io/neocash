import type { UIMessage } from "ai";

export interface ChatRecord {
  id: string;
  title: string;
  messages: UIMessage[];
  model: string;
  createdAt: number;
  updatedAt: number;
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  provider: string;
}

export interface PromptCategory {
  id: string;
  label: string;
  icon: string;
  prompts: string[];
}
