"use client";

import { useEffect, useState, use } from "react";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { nanoid } from "nanoid";
import { getChat, saveChat } from "@/hooks/useChatHistory";
import {
  saveDocument,
  listDocuments,
  updateDocumentMetadata,
} from "@/hooks/useDocumentStore";
import { extractDocumentMetadata } from "@/lib/file-utils";

export default function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = use(params);
  const searchParams = useSearchParams();
  const { selectedModel, researchMode, webSearch, setActiveChatId, refreshChatList, refreshDocumentList, pendingFiles } = useApp();
  const [initialLoaded, setInitialLoaded] = useState(false);

  const { messages, sendMessage, stop, setMessages, status } = useChat({
    id: chatId,
    transport: new TextStreamChatTransport({
      api: "/api/chat",
      body: { model: selectedModel, researchMode, webSearch },
    }),
    onFinish: async ({ message }) => {
      refreshChatList();
      // Extract metadata for documents in this chat that have none
      try {
        const docs = await listDocuments();
        const chatDocs = docs.filter(
          (d) => d.chatId === chatId && !d.metadata,
        );
        if (chatDocs.length > 0) {
          const text =
            message.parts
              ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
              .map((p) => p.text)
              .join("") || "";
          if (text) {
            for (const doc of chatDocs) {
              const meta = extractDocumentMetadata(text, doc.filename);
              await updateDocumentMetadata(doc.id, meta);
            }
            refreshDocumentList();
          }
        }
      } catch {
        // Non-critical — metadata extraction is best-effort
      }
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
      const files = pendingFiles.current.length > 0 ? pendingFiles.current : undefined;
      pendingFiles.current = [];
      sendMessage({ text: initialMessage, files });
    }
  }, [initialLoaded, searchParams, chatId, messages.length, sendMessage, pendingFiles]);

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
            onSend={async (text, files) => {
              if (files) {
                for (const file of files) {
                  if (!file.mediaType.startsWith("image/")) {
                    await saveDocument({
                      id: nanoid(10),
                      filename: file.filename || "Document",
                      mediaType: file.mediaType,
                      chatId,
                      metadata: "",
                      fileSize: file.url.length,
                      createdAt: Date.now(),
                    });
                  }
                }
                refreshDocumentList();
              }
              sendMessage({ text, files });
            }}
            onStop={stop}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
