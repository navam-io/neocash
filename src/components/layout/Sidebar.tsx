"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { ChatList } from "./ChatList";
import { DocumentList } from "./DocumentList";
import { GoalList } from "./GoalList";
import { MemoryList } from "./MemoryList";
import { MemoryEditor } from "../memory/MemoryEditor";
import { UserProfile } from "./UserProfile";
import { SidebarToggle } from "./SidebarToggle";
import { APP_NAME } from "@/lib/constants";

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useApp();
  const router = useRouter();
  const [memoryEditorOpen, setMemoryEditorOpen] = useState(false);

  // Responsive: collapse on small screens
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setSidebarOpen]);

  // Keyboard shortcut: Cmd+Shift+N for new chat
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "n") {
        e.preventDefault();
        router.push("/chat/new");
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`sidebar-transition flex flex-col bg-sidebar-bg h-screen shrink-0 overflow-hidden z-40 ${
          sidebarOpen ? "w-[280px]" : "w-12"
        } max-md:fixed max-md:left-0 max-md:top-0 ${
          !sidebarOpen ? "max-md:w-0 max-md:opacity-0" : ""
        }`}
        style={{ boxShadow: "var(--shadow-sidebar)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 pt-3 pb-2">
          {sidebarOpen && (
            <span className="text-sm font-semibold text-text-primary tracking-tight">
              {APP_NAME}
            </span>
          )}
          <SidebarToggle />
        </div>

        {sidebarOpen ? (
          <>
            {/* Actions */}
            <div className="flex flex-col gap-0.5 px-2 pb-2">
              <button
                onClick={() => router.push("/chat/new")}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-text-secondary hover:bg-sidebar-hover transition-colors"
              >
                <Plus size={16} />
                <span>New chat</span>
              </button>
              <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-text-secondary hover:bg-sidebar-hover transition-colors">
                <Search size={16} />
                <span>Search</span>
              </button>
            </div>

            {/* Divider */}
            <div className="mx-3 border-t border-border" />

            {/* Memory */}
            <MemoryList onOpenEditor={() => setMemoryEditorOpen(true)} />
            <div className="mx-3 border-t border-border" />

            {/* Documents */}
            <DocumentList />
            <div className="mx-3 border-t border-border" />

            {/* Goals */}
            <GoalList />
            <div className="mx-3 border-t border-border" />

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto py-2">
              <ChatList />
            </div>

            {/* User Profile */}
            <div className="border-t border-border p-2">
              <UserProfile />
            </div>
          </>
        ) : (
          /* Collapsed: just show new-chat icon */
          <div className="flex flex-col items-center gap-1 pt-2">
            <button
              onClick={() => router.push("/chat/new")}
              aria-label="New chat"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-sidebar-hover transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>
        )}
      </aside>

      {memoryEditorOpen && (
        <MemoryEditor onClose={() => setMemoryEditorOpen(false)} />
      )}
    </>
  );
}
