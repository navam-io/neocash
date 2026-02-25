"use client";

import { PanelLeftClose, PanelLeft } from "lucide-react";
import { useApp } from "@/context/AppContext";

export function SidebarToggle() {
  const { sidebarOpen, toggleSidebar } = useApp();

  return (
    <button
      onClick={toggleSidebar}
      aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-hover transition-colors"
    >
      {sidebarOpen ? (
        <PanelLeftClose size={18} />
      ) : (
        <PanelLeft size={18} />
      )}
    </button>
  );
}
