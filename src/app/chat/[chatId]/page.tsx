"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { GoalSignalPanel } from "@/components/goals/GoalSignalPanel";
import { nanoid } from "nanoid";
import { getChat, saveChat } from "@/hooks/useChatHistory";
import {
  saveDocument,
  listDocuments,
  updateDocumentMetadata,
} from "@/hooks/useDocumentStore";
import {
  listGoals,
  updateGoalStatus,
  toggleCrossPollination,
  incrementGoalSignals,
} from "@/hooks/useGoalStore";
import { saveSignal, listSignalsForGoal } from "@/hooks/useSignalStore";
import { extractDocumentMetadata } from "@/lib/file-utils";
import type { GoalMeta, GoalStatus, SignalRecord } from "@/types";

export default function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = use(params);
  const searchParams = useSearchParams();
  const {
    selectedModel,
    researchMode,
    webSearch,
    setActiveChatId,
    refreshChatList,
    refreshDocumentList,
    refreshGoalList,
    pendingFiles,
  } = useApp();
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [goalMeta, setGoalMeta] = useState<GoalMeta | null>(null);
  const [goalTitle, setGoalTitle] = useState("");
  const [signals, setSignals] = useState<SignalRecord[]>([]);

  // Build transport body — include goalContext when this is a goal thread
  const transportBody = goalMeta
    ? {
        model: selectedModel,
        researchMode,
        webSearch,
        goalContext: { title: goalTitle, goal: goalMeta, signals },
      }
    : { model: selectedModel, researchMode, webSearch };

  const { messages, sendMessage, stop, setMessages, status } = useChat({
    id: chatId,
    transport: new TextStreamChatTransport({
      api: "/api/chat",
      body: transportBody,
    }),
    onFinish: async ({ message }) => {
      refreshChatList();
      if (goalMeta) refreshGoalList();

      // Extract metadata for documents in this chat that have none
      try {
        const docs = await listDocuments();
        const chatDocs = docs.filter(
          (d) => d.chatId === chatId && !d.metadata,
        );
        if (chatDocs.length > 0) {
          const text =
            message.parts
              ?.filter(
                (p): p is { type: "text"; text: string } => p.type === "text",
              )
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

      // Cross-pollination: detect signals for active goals (non-goal chats only)
      if (!goalMeta) {
        try {
          const responseText =
            message.parts
              ?.filter(
                (p): p is { type: "text"; text: string } => p.type === "text",
              )
              .map((p) => p.text)
              .join("") || "";

          if (responseText.length > 50) {
            const activeGoals = await listGoals();
            const pollinateGoals = activeGoals.filter(
              (g) =>
                g.goal?.status === "active" && g.goal?.crossPollinate,
            );

            if (pollinateGoals.length > 0) {
              const goalSummaries = pollinateGoals.map((g) => ({
                id: g.id,
                title: g.title,
                description: g.goal!.description,
                category: g.goal!.category || "",
              }));

              const resp = await fetch("/api/detect-signals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  responseText: responseText.slice(0, 2000),
                  goals: goalSummaries,
                }),
              });

              if (resp.ok) {
                const data = await resp.json();
                if (data.signals && data.signals.length > 0) {
                  for (const sig of data.signals) {
                    await saveSignal({
                      id: nanoid(10),
                      goalId: sig.goalId,
                      sourceChatId: chatId,
                      sourceMessageId: message.id,
                      summary: sig.summary,
                      category: sig.category,
                      createdAt: Date.now(),
                    });
                    await incrementGoalSignals(sig.goalId);
                  }
                  refreshGoalList();
                }
              }
            }
          }
        } catch {
          // Non-critical — signal detection is best-effort
        }
      }
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Set active chat
  useEffect(() => {
    setActiveChatId(chatId);
    return () => setActiveChatId(null);
  }, [chatId, setActiveChatId]);

  // Load existing messages and goal context from IndexedDB
  useEffect(() => {
    async function load() {
      const chat = await getChat(chatId);
      if (chat) {
        if (chat.messages.length > 0) {
          setMessages(chat.messages);
        }
        if (chat.goal) {
          setGoalMeta(chat.goal);
          setGoalTitle(chat.title);
          const sigs = await listSignalsForGoal(chatId);
          setSignals(sigs);
        }
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
      const files =
        pendingFiles.current.length > 0 ? pendingFiles.current : undefined;
      pendingFiles.current = [];
      sendMessage({ text: initialMessage, files });
    }
  }, [
    initialLoaded,
    searchParams,
    chatId,
    messages.length,
    sendMessage,
    pendingFiles,
  ]);

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

  const handleStatusChange = useCallback(
    async (newStatus: GoalStatus) => {
      await updateGoalStatus(chatId, newStatus);
      setGoalMeta((prev) => (prev ? { ...prev, status: newStatus } : null));
      refreshGoalList();
    },
    [chatId, refreshGoalList],
  );

  const handleTogglePollinate = useCallback(async () => {
    await toggleCrossPollination(chatId);
    setGoalMeta((prev) =>
      prev ? { ...prev, crossPollinate: !prev.crossPollinate } : null,
    );
    refreshGoalList();
  }, [chatId, refreshGoalList]);

  return (
    <div className="flex h-full flex-col">
      {goalMeta && (
        <GoalSignalPanel
          title={goalTitle}
          goal={goalMeta}
          signals={signals}
          onStatusChange={handleStatusChange}
          onTogglePollinate={handleTogglePollinate}
        />
      )}

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
