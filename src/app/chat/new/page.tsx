"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import type { FileUIPart } from "ai";
import { useApp } from "@/context/AppContext";
import { ChatGreeting } from "@/components/chat/ChatGreeting";
import { ChatInput } from "@/components/chat/ChatInput";
import { PromptCategories } from "@/components/chat/PromptCategories";
import { createChat, saveChat } from "@/hooks/useChatHistory";
import { createGoal, setDashboardSchema, scanExistingChatsForSignals } from "@/hooks/useGoalStore";
import { saveDocument } from "@/hooks/useDocumentStore";

export default function NewChatPage() {
  const router = useRouter();
  const { selectedModel, setActiveChatId, refreshChatList, refreshGoalList, refreshDocumentList, pendingFiles } = useApp();
  const [inputValue, setInputValue] = useState("");
  const [previewText, setPreviewText] = useState("");

  const categoriesVisible = inputValue.trim().length === 0;

  const startChat = useCallback(
    async (message: string, files?: FileUIPart[], categoryId?: string, goalTitle?: string) => {
      const id = nanoid(10);

      // Any category selection creates a goal thread
      if (categoryId) {
        const title = goalTitle || message.slice(0, 60);
        await createGoal(id, selectedModel, title, categoryId, message, "predefined");
        setActiveChatId(id);
        refreshGoalList();
        refreshChatList();
        // Fire-and-forget: generate schema first, then scan with schema available
        fetch("/api/generate-dashboard-schema", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description: message, category: categoryId }),
        })
          .then((r) => r.json())
          .then(async (data) => {
            const schema = data.schema?.length > 0 ? data.schema : undefined;
            if (schema) await setDashboardSchema(id, schema);
            refreshGoalList();
            return scanExistingChatsForSignals(id, title, message, categoryId, schema);
          })
          .then(() => refreshGoalList())
          .catch(() => {/* best-effort */});
        router.push(`/chat/${id}?message=${encodeURIComponent(message)}`);
        return;
      }

      // Free text — create regular chat
      const chat = await createChat(id, selectedModel);
      chat.title = message.slice(0, 60);
      await saveChat(chat);
      setActiveChatId(id);
      refreshChatList();
      if (files && files.length > 0) {
        pendingFiles.current = files;
        for (const file of files) {
          if (!file.mediaType.startsWith("image/")) {
            await saveDocument({
              id: nanoid(10),
              filename: file.filename || "Document",
              mediaType: file.mediaType,
              chatId: id,
              metadata: "",
              fileSize: file.url.length,
              createdAt: Date.now(),
            });
          }
        }
        refreshDocumentList();
      }
      router.push(`/chat/${id}?message=${encodeURIComponent(message)}`);
    },
    [selectedModel, setActiveChatId, refreshChatList, refreshGoalList, refreshDocumentList, pendingFiles, router],
  );

  return (
    <div className="flex h-full flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl flex flex-col items-center gap-6">
        <ChatGreeting />

        <ChatInput
          onSend={(text, files) => startChat(text, files)}
          autoFocus
          value={inputValue}
          onChange={setInputValue}
          previewText={previewText}
        />

        <PromptCategories
          onSelectPrompt={(prompt, categoryId, goalTitle) => {
            setPreviewText("");
            startChat(prompt, undefined, categoryId, goalTitle);
          }}
          visible={categoriesVisible}
          onPreview={setPreviewText}
        />
      </div>
    </div>
  );
}
