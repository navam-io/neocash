"use client";

import { useState, useRef, useEffect } from "react";
import {
  Receipt,
  TrendingUp,
  PiggyBank,
  Wallet,
  CreditCard,
  HeartHandshake,
  Shield,
  Briefcase,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { promptCategories, resolvePromptYears } from "@/lib/prompts";
import { PromptSuggestions } from "./PromptSuggestions";
import { useApp } from "@/context/AppContext";
import { listGoals } from "@/hooks/useGoalStore";
import { GoalCreateForm } from "@/components/goals/GoalCreateForm";
import type { ChatRecord, Prompt } from "@/types";

const iconMap = {
  receipt: Receipt,
  "trending-up": TrendingUp,
  "piggy-bank": PiggyBank,
  wallet: Wallet,
  "credit-card": CreditCard,
  "heart-handshake": HeartHandshake,
  shield: Shield,
  briefcase: Briefcase,
} as const;

interface PromptCategoriesProps {
  onSelectPrompt: (prompt: string, categoryId?: string, goalTitle?: string) => void;
  visible?: boolean;
  onPreview?: (text: string) => void;
}

export function PromptCategories({
  onSelectPrompt,
  visible = true,
  onPreview,
}: PromptCategoriesProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [existingGoals, setExistingGoals] = useState<ChatRecord[]>([]);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { goalListVersion } = useApp();
  const router = useRouter();

  // Load existing goals for the active category
  useEffect(() => {
    if (activeCategory) {
      listGoals().then((goals) => {
        const filtered = goals.filter((g) => g.goal?.category === activeCategory);
        setExistingGoals(filtered);
      });
    }
  }, [activeCategory, goalListVersion]);

  useEffect(() => {
    if (activeCategory === null && !showGoalForm) return;

    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveCategory(null);
        setShowGoalForm(false);
        onPreview?.("");
      }
    }

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [activeCategory, showGoalForm, onPreview]);

  const activeData = promptCategories.find((c) => c.id === activeCategory);

  // Resolve year placeholders in prompts for display
  const resolvedPrompts: Prompt[] | undefined = activeData?.prompts.map((p) => ({
    title: resolvePromptYears(p.title),
    text: resolvePromptYears(p.text),
  }));

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
      {/* Category tabs — two rows of 4 + standalone [+] button */}
      <div className="flex flex-wrap justify-center gap-2 max-w-xl">
        {promptCategories.map((category) => {
          const Icon = iconMap[category.icon as keyof typeof iconMap];
          const isActive = activeCategory === category.id;

          return (
            <button
              key={category.id}
              onClick={() => {
                const next = isActive ? null : category.id;
                setActiveCategory(next);
                setShowGoalForm(false);
                if (!next) onPreview?.("");
              }}
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
        {/* Standalone [+] custom goal button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowGoalForm(!showGoalForm);
            setActiveCategory(null);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-accent hover:bg-surface-hover transition-colors shadow-[0_0_0_0.5px_rgba(196,112,75,0.3)]"
          aria-label="New custom goal"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Goal create form */}
      {showGoalForm && (
        <div className="w-full max-w-lg">
          <GoalCreateForm onClose={() => setShowGoalForm(false)} />
        </div>
      )}

      {/* Suggestions dropdown */}
      {activeData && resolvedPrompts && (
        <div className="w-full max-w-lg">
          <PromptSuggestions
            prompts={resolvedPrompts}
            existingGoals={existingGoals.length > 0 ? existingGoals : undefined}
            onGoalNavigate={(goalId) => {
              setActiveCategory(null);
              onPreview?.("");
              router.push(`/chat/${goalId}`);
            }}
            onSelect={(prompt) => {
              onSelectPrompt(prompt.text, activeData.id, prompt.title);
              setActiveCategory(null);
              onPreview?.("");
            }}
            onPreview={onPreview}
          />
        </div>
      )}
    </div>
  );
}
