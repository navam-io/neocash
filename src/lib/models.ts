import type { ModelOption } from "@/types";

export const models: ModelOption[] = [
  {
    id: "claude-sonnet-4-6",
    name: "Sonnet 4.6",
    description: "Best combination of speed and intelligence",
    provider: "anthropic",
  },
  {
    id: "claude-haiku-4-5-20251001",
    name: "Haiku 4.5",
    description: "Fastest with near-frontier intelligence",
    provider: "anthropic",
  },
  {
    id: "claude-opus-4-6",
    name: "Opus 4.6",
    description: "Most intelligent for complex tasks",
    provider: "anthropic",
  },
];

export function getModelById(id: string): ModelOption | undefined {
  return models.find((m) => m.id === id);
}

export function getModelName(id: string): string {
  return getModelById(id)?.name ?? "Sonnet 4.6";
}
