"use client";

import { useEffect, useState, use } from "react";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { getChat, saveChat } from "@/hooks/useChatHistory";

export default function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = use(params);
  const searchParams = useSearchParams();
  const { selectedModel, setActiveChatId, refreshChatList } = useApp();
  const [initialLoaded, setInitialLoaded] = useState(false);

  const { messages, sendMessage, stop, setMessages, status } = useChat({
    id: chatId,
    transport: new TextStreamChatTransport({
      api: "/api/chat",
      body: { model: selectedModel },
    }),
    onFinish: async () => {
      refreshChatList();
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Set active chat
  useEffect(() => {
    setActiveChatId(chatId);
    return () => setActiveChatId(null);
  }, [chatId, setActiveChatId]);

  // Load existing messages from IndexedDB
  useEffect(() => {
    async function load() {
      const chat = await getChat(chatId);
      if (chat && chat.messages.length > 0) {
        setMessages(chat.messages);
      }
      setInitialLoaded(true);
    }
    load();
  }, [chatId, setMessages]);

  // Handle initial message from URL param (new chat flow)
  useEffect(() => {
    if (!initialLoaded) return;
    const initialMessage = searchParams.get("message");
    if (initialMessage && messages.length === 0) {
      window.history.replaceState({}, "", `/chat/${chatId}`);
      sendMessage({ text: initialMessage });
    }
  }, [initialLoaded, searchParams, chatId, messages.length, sendMessage]);

  // Persist messages to IndexedDB whenever they change
  useEffect(() => {
    if (messages.length === 0) return;
    async function persist() {
      const existing = await getChat(chatId);
      if (existing) {
        existing.messages = messages;
        if (!existing.title) {
          const firstUser = messages.find((m) => m.role === "user");
          if (firstUser) {
            const text =
              firstUser.parts
                ?.filter((p) => p.type === "text")
                .map((p) => p.text)
                .join("") || "";
            existing.title = text.slice(0, 60);
          }
        }
        await saveChat(existing);
        refreshChatList();
      }
    }
    persist();
  }, [messages, chatId, refreshChatList]);

  return (
    <div className="flex h-full flex-col">
      <ChatMessages messages={messages} isLoading={isLoading} />

      <div className="shrink-0 px-4 pb-4">
        <div className="mx-auto max-w-2xl">
          <ChatInput
            onSend={(text) => sendMessage({ text })}
            onStop={stop}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
