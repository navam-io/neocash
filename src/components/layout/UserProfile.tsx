"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Database, Trash2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { clearAllChats } from "@/hooks/useChatHistory";
import { clearAllSignals } from "@/hooks/useSignalStore";
import { clearAllDocuments } from "@/hooks/useDocumentStore";

export function UserProfile() {
  const router = useRouter();
  const { refreshChatList, refreshGoalList, refreshDocumentList } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "reset" | "sample" | null
  >(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Click-outside to dismiss
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setConfirmAction(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  async function handleReset() {
    await clearAllChats();
    await clearAllSignals();
    await clearAllDocuments();
    refreshChatList();
    refreshGoalList();
    refreshDocumentList();
    setMenuOpen(false);
    setConfirmAction(null);
    router.push("/");
  }

  async function handleLoadSample() {
    // Dynamic import to keep sample data out of the main bundle
    const { loadSampleData } = await import("@/lib/sample-data");
    await clearAllChats();
    await clearAllSignals();
    await clearAllDocuments();
    await loadSampleData();
    refreshChatList();
    refreshGoalList();
    refreshDocumentList();
    setMenuOpen(false);
    setConfirmAction(null);
    router.push("/");
  }

  return (
    <div ref={menuRef} className="relative">
      {/* Menu popover */}
      {menuOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-1 rounded-lg border border-border bg-surface shadow-lg py-1 z-50">
          {confirmAction === "sample" ? (
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs text-text-secondary">Replace all data?</span>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="text-xs text-text-secondary hover:text-text-primary px-1.5 py-0.5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLoadSample}
                  className="text-xs text-accent font-medium hover:text-accent-hover px-1.5 py-0.5"
                >
                  Load
                </button>
              </div>
            </div>
          ) : confirmAction === "reset" ? (
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs text-red-700">Delete everything?</span>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="text-xs text-text-secondary hover:text-text-primary px-1.5 py-0.5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  className="text-xs text-red-600 font-medium hover:text-red-700 px-1.5 py-0.5"
                >
                  Reset
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={() => setConfirmAction("sample")}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-sidebar-hover transition-colors"
              >
                <Database size={14} className="opacity-60" />
                Load Sample Data
              </button>
              <button
                onClick={() => setConfirmAction("reset")}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} className="opacity-60" />
                Reset All Data
              </button>
            </>
          )}
        </div>
      )}

      {/* Profile pill */}
      <button
        onClick={() => {
          setMenuOpen(!menuOpen);
          setConfirmAction(null);
        }}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-sidebar-hover transition-colors cursor-pointer"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-light">
          <User size={14} className="text-accent" />
        </div>
        <span className="truncate font-medium">Personal</span>
      </button>
    </div>
  );
}
