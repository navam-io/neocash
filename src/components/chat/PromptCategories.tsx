"use client";

import { useState, useRef, useEffect } from "react";
import {
  Receipt,
  TrendingUp,
  PieChart,
  Wallet,
  Sparkles,
  Target,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { promptCategories } from "@/lib/prompts";
import { PromptSuggestions } from "./PromptSuggestions";
import { useApp } from "@/context/AppContext";
import { listGoals } from "@/hooks/useGoalStore";
import { GoalCreateForm } from "@/components/goals/GoalCreateForm";
import type { ChatRecord } from "@/types";

const iconMap = {
  receipt: Receipt,
  "trending-up": TrendingUp,
  "pie-chart": PieChart,
  wallet: Wallet,
  sparkles: Sparkles,
  target: Target,
} as const;

interface PromptCategoriesProps {
  onSelectPrompt: (prompt: string, categoryId?: string, goalTitle?: string) => void;
  visible?: boolean;
  onPrefill?: (text: string) => void;
}

export function PromptCategories({
  onSelectPrompt,
  visible = true,
  onPrefill,
}: PromptCategoriesProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [existingGoals, setExistingGoals] = useState<ChatRecord[]>([]);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { goalListVersion } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (activeCategory === "goals") {
      listGoals().then(setExistingGoals);
    }
  }, [activeCategory, goalListVersion]);

  useEffect(() => {
    if (activeCategory === null) return;

    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveCategory(null);
      }
    }

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [activeCategory]);

  const activeData = promptCategories.find((c) => c.id === activeCategory);

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center gap-3 w-full transition-all duration-300 ease-in-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      {/* Category tabs */}
      <div className="flex flex-wrap justify-center gap-2">
        {promptCategories.map((category) => {
          const Icon = iconMap[category.icon as keyof typeof iconMap];
          const isActive = activeCategory === category.id;
          const isGoal = category.id === "goals";

          return (
            <div key={category.id} className="flex items-center">
              <button
                onClick={() =>
                  setActiveCategory(isActive ? null : category.id)
                }
                className={`category-tab flex items-center gap-1.5 rounded-lg px-3 h-8 text-sm ${
                  isActive
                    ? "bg-surface text-text-primary shadow-[0_0_0_0.5px_rgba(31,30,29,0.25)]"
                    : isGoal
                      ? "text-accent hover:bg-surface-hover shadow-[0_0_0_0.5px_rgba(196,112,75,0.3)]"
                      : "text-text-secondary hover:bg-surface-hover shadow-[0_0_0_0.5px_rgba(31,30,29,0.12)]"
                }`}
              >
                {Icon && <Icon size={14} />}
                <span>{category.label}</span>
              </button>
              {isGoal && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowGoalForm(!showGoalForm);
                    setActiveCategory(null);
                  }}
                  className="ml-0.5 flex h-8 w-6 items-center justify-center rounded-lg text-accent hover:bg-surface-hover transition-colors"
                  aria-label="New goal"
                >
                  <Plus size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Goal create form */}
      {showGoalForm && (
        <div className="w-full max-w-lg">
          <GoalCreateForm onClose={() => setShowGoalForm(false)} />
        </div>
      )}

      {/* Suggestions dropdown */}
      {activeData && (
        <div className="w-full max-w-lg">
          <PromptSuggestions
            prompts={activeData.prompts}
            existingGoals={activeData.id === "goals" ? existingGoals : undefined}
            onGoalNavigate={(goalId) => {
              setActiveCategory(null);
              router.push(`/chat/${goalId}`);
            }}
            onSelect={(prompt) => {
              if (activeData.id === "goals") {
                // Goals prompts bypass prefill — create goal thread directly
                onSelectPrompt(prompt.text, activeData.id, prompt.title);
              } else if (onPrefill) {
                onPrefill(prompt.text);
              } else {
                onSelectPrompt(prompt.title, activeData.id);
              }
              setActiveCategory(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
