"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { listChats } from "@/hooks/useChatHistory";
import type { ChatRecord } from "@/types";

export function ChatList() {
  const { activeChatId, chatListVersion } = useApp();
  const router = useRouter();
  const [chats, setChats] = useState<ChatRecord[]>([]);

  useEffect(() => {
    listChats().then(setChats);
  }, [chatListVersion]);

  if (chats.length === 0) {
    return (
      <div className="px-3 py-4 text-sm text-text-tertiary">
        No conversations yet
      </div>
    );
  }

  return (
    <nav className="flex flex-col gap-0.5 px-2" aria-label="Chat history">
      {chats.map((chat) => (
        <button
          key={chat.id}
          onClick={() => router.push(`/chat/${chat.id}`)}
          className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors truncate ${
            activeChatId === chat.id
              ? "bg-sidebar-active text-text-primary"
              : "text-text-secondary hover:bg-sidebar-hover"
          }`}
        >
          <MessageSquare size={14} className="shrink-0 opacity-50" />
          <span className="truncate">{chat.title || "New chat"}</span>
        </button>
      ))}
    </nav>
  );
}
