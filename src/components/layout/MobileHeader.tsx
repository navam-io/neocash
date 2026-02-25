"use client";

import { PanelLeft } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { APP_NAME } from "@/lib/constants";

export function MobileHeader() {
  const { sidebarOpen, setSidebarOpen } = useApp();

  // Only show on mobile when sidebar is closed
  if (sidebarOpen) return null;

  return (
    <div className="md:hidden flex items-center gap-2 px-3 py-2 border-b border-border">
      <button
        onClick={() => setSidebarOpen(true)}
        aria-label="Open sidebar"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-hover transition-colors"
      >
        <PanelLeft size={18} />
      </button>
      <span className="text-sm font-semibold text-text-primary">
        {APP_NAME}
      </span>
    </div>
  );
}
