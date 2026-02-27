"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Trash2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { listRegularChats } from "@/hooks/useGoalStore";
import { deleteChatWithCascade } from "@/hooks/useChatHistory";
import type { ChatRecord } from "@/types";

export function ChatList() {
  const { activeChatId, chatListVersion, refreshChatList, refreshDocumentList } =
    useApp();
  const router = useRouter();
  const [chats, setChats] = useState<ChatRecord[]>([]);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => {
    listRegularChats().then(setChats);
  }, [chatListVersion]);

  async function handleDelete(id: string) {
    await deleteChatWithCascade(id);
    setConfirmingId(null);
    refreshChatList();
    refreshDocumentList();
    if (activeChatId === id) router.push("/");
  }

  if (chats.length === 0) {
    return (
      <div className="px-3 py-4 text-sm text-text-tertiary">
        No conversations yet
      </div>
    );
  }

  return (
    <nav className="flex flex-col gap-0.5 px-2" aria-label="Chat history">
      {chats.map((chat) =>
        confirmingId === chat.id ? (
          <div
            key={chat.id}
            className="flex items-center justify-between rounded-lg px-2 py-1.5 bg-red-50 text-sm"
          >
            <span className="text-red-700 truncate text-xs">Delete?</span>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => setConfirmingId(null)}
                className="text-xs text-text-secondary hover:text-text-primary px-1.5 py-0.5"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(chat.id)}
                className="text-xs text-red-600 font-medium hover:text-red-700 px-1.5 py-0.5"
              >
                Yes
              </button>
            </div>
          </div>
        ) : (
          <div key={chat.id} className="group relative flex items-center">
            <button
              onClick={() => router.push(`/chat/${chat.id}`)}
              className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors truncate w-full ${
                activeChatId === chat.id
                  ? "bg-sidebar-active text-text-primary"
                  : "text-text-secondary hover:bg-sidebar-hover"
              }`}
            >
              <MessageSquare size={14} className="shrink-0 opacity-50" />
              <span className="truncate">{chat.title || "New chat"}</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmingId(chat.id);
              }}
              className="absolute right-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-100"
              aria-label="Delete chat"
            >
              <Trash2 size={12} className="text-text-tertiary hover:text-red-500" />
            </button>
          </div>
        ),
      )}
    </nav>
  );
}
