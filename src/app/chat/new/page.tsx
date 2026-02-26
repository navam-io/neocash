"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { useApp } from "@/context/AppContext";
import { ChatGreeting } from "@/components/chat/ChatGreeting";
import { ChatInput } from "@/components/chat/ChatInput";
import { PromptCategories } from "@/components/chat/PromptCategories";
import { createChat, saveChat } from "@/hooks/useChatHistory";

export default function NewChatPage() {
  const router = useRouter();
  const { selectedModel, setActiveChatId, refreshChatList } = useApp();
  const [inputValue, setInputValue] = useState("");

  const categoriesVisible = inputValue.trim().length === 0;

  const startChat = useCallback(
    async (message: string) => {
      const id = nanoid(10);
      const chat = await createChat(id, selectedModel);
      chat.title = message.slice(0, 60);
      await saveChat(chat);
      setActiveChatId(id);
      refreshChatList();
      router.push(`/chat/${id}?message=${encodeURIComponent(message)}`);
    },
    [selectedModel, setActiveChatId, refreshChatList, router],
  );

  function handlePrefill(text: string) {
    setInputValue(text);
  }

  return (
    <div className="flex h-full flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl flex flex-col items-center gap-6">
        <ChatGreeting />

        <ChatInput
          onSend={(text) => startChat(text)}
          autoFocus
          value={inputValue}
          onChange={setInputValue}
        />

        <PromptCategories
          onSelectPrompt={startChat}
          visible={categoriesVisible}
          onPrefill={handlePrefill}
        />
      </div>
    </div>
  );
}
