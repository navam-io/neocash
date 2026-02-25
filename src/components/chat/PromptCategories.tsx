"use client";

import { useState } from "react";
import {
  Receipt,
  TrendingUp,
  PieChart,
  Wallet,
  Sparkles,
} from "lucide-react";
import { promptCategories } from "@/lib/prompts";
import { PromptSuggestions } from "./PromptSuggestions";

const iconMap = {
  receipt: Receipt,
  "trending-up": TrendingUp,
  "pie-chart": PieChart,
  wallet: Wallet,
  sparkles: Sparkles,
} as const;

interface PromptCategoriesProps {
  onSelectPrompt: (prompt: string) => void;
}

export function PromptCategories({ onSelectPrompt }: PromptCategoriesProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const activeData = promptCategories.find((c) => c.id === activeCategory);

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Category tabs */}
      <div className="flex flex-wrap justify-center gap-2">
        {promptCategories.map((category) => {
          const Icon = iconMap[category.icon as keyof typeof iconMap];
          const isActive = activeCategory === category.id;

          return (
            <button
              key={category.id}
              onClick={() =>
                setActiveCategory(isActive ? null : category.id)
              }
              className={`category-tab flex items-center gap-1.5 rounded-lg px-3 h-8 text-sm ${
                isActive
                  ? "bg-surface text-text-primary shadow-[0_0_0_0.5px_rgba(31,30,29,0.25)]"
                  : "text-text-secondary hover:bg-surface-hover shadow-[0_0_0_0.5px_rgba(31,30,29,0.12)]"
              }`}
            >
              {Icon && <Icon size={14} />}
              <span>{category.label}</span>
            </button>
          );
        })}
      </div>

      {/* Suggestions dropdown */}
      {activeData && (
        <div className="w-full max-w-lg">
          <PromptSuggestions
            prompts={activeData.prompts}
            onSelect={(prompt) => {
              onSelectPrompt(prompt);
              setActiveCategory(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
