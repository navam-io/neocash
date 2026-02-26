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
