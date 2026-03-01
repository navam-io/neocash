import {
  Target,
  Brain,
  Zap,
  LayoutDashboard,
  FileText,
  MessageSquare,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Lightbulb,
  ArrowUpDown,
  Globe,
  Search,
  BotMessageSquare,
  type LucideIcon,
} from "lucide-react";
import type { ToolName } from "@/lib/tool-schemas";

export interface ToolLabel {
  label: string;
  activeLabel: string;
  doneLabel: string;
  icon: LucideIcon;
  category: "read" | "write";
}

const toolLabels: Record<ToolName, ToolLabel> = {
  list_goals: {
    label: "Your goals",
    activeLabel: "Checking your goals...",
    doneLabel: "Reviewed your goals",
    icon: Target,
    category: "read",
  },
  get_goal: {
    label: "Goal details",
    activeLabel: "Loading goal details...",
    doneLabel: "Loaded goal details",
    icon: Target,
    category: "read",
  },
  list_signals: {
    label: "Goal signals",
    activeLabel: "Loading signals...",
    doneLabel: "Loaded signals",
    icon: Zap,
    category: "read",
  },
  list_memories: {
    label: "Your profile",
    activeLabel: "Checking your profile...",
    doneLabel: "Reviewed your profile",
    icon: Brain,
    category: "read",
  },
  list_documents: {
    label: "Your documents",
    activeLabel: "Checking documents...",
    doneLabel: "Reviewed documents",
    icon: FileText,
    category: "read",
  },
  list_chats: {
    label: "Recent chats",
    activeLabel: "Checking recent chats...",
    doneLabel: "Reviewed recent chats",
    icon: MessageSquare,
    category: "read",
  },
  save_memory: {
    label: "Saving to profile",
    activeLabel: "Saving to your profile...",
    doneLabel: "Saved to your profile",
    icon: Brain,
    category: "write",
  },
  update_memory: {
    label: "Updating profile",
    activeLabel: "Updating your profile...",
    doneLabel: "Updated your profile",
    icon: Pencil,
    category: "write",
  },
  delete_memory: {
    label: "Removing from profile",
    activeLabel: "Removing from profile...",
    doneLabel: "Removed from profile",
    icon: Trash2,
    category: "write",
  },
  save_signal: {
    label: "Cross-pollinating",
    activeLabel: "Saving signal to goal...",
    doneLabel: "Signal saved to goal",
    icon: Zap,
    category: "write",
  },
  update_dashboard: {
    label: "Updating dashboard",
    activeLabel: "Updating dashboard metrics...",
    doneLabel: "Updated dashboard",
    icon: LayoutDashboard,
    category: "write",
  },
  add_action_items: {
    label: "Adding actions",
    activeLabel: "Adding action items...",
    doneLabel: "Added action items",
    icon: Plus,
    category: "write",
  },
  complete_action_item: {
    label: "Completing action",
    activeLabel: "Marking action complete...",
    doneLabel: "Action completed",
    icon: CheckCircle2,
    category: "write",
  },
  add_insights: {
    label: "Adding insights",
    activeLabel: "Adding insights...",
    doneLabel: "Added insights",
    icon: Lightbulb,
    category: "write",
  },
  update_goal_status: {
    label: "Updating goal",
    activeLabel: "Updating goal status...",
    doneLabel: "Updated goal status",
    icon: ArrowUpDown,
    category: "write",
  },
  generate_dashboard: {
    label: "Generating dashboard",
    activeLabel: "Generating dashboard metrics...",
    doneLabel: "Dashboard created",
    icon: LayoutDashboard,
    category: "write",
  },
  scan_chats_for_signals: {
    label: "Scanning conversations",
    activeLabel: "Scanning conversations for signals...",
    doneLabel: "Scanned conversations",
    icon: Search,
    category: "write",
  },
  run_background_agent: {
    label: "Deep analysis",
    activeLabel: "Running deep analysis...",
    doneLabel: "Analysis complete",
    icon: BotMessageSquare,
    category: "write",
  },
};

// Provider-managed tools (e.g. Anthropic web search) — not in allTools schema
const providerToolLabels: Record<string, ToolLabel> = {
  webSearch: {
    label: "Web search",
    activeLabel: "Searching the web...",
    doneLabel: "Searched the web",
    icon: Globe,
    category: "read",
  },
};

const fallbackLabel: ToolLabel = {
  label: "Working",
  activeLabel: "Working...",
  doneLabel: "Done",
  icon: Zap,
  category: "read",
};

export function getToolLabel(toolName: string): ToolLabel {
  return toolLabels[toolName as ToolName] ?? providerToolLabels[toolName] ?? fallbackLabel;
}

export function isWriteTool(toolName: string): boolean {
  return (toolLabels[toolName as ToolName]?.category ?? "read") === "write";
}
