"use client";

import { useEffect, useState, useCallback, useSyncExternalStore, use } from "react";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { GoalSignalPanel } from "@/components/goals/GoalSignalPanel";
import { GoalDashboardPanel } from "@/components/goals/GoalDashboardPanel";
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
  setDashboardSchema,
  toggleActionItem,
  dismissInsight,
  scanGoalThreadForSignals,
} from "@/hooks/useGoalStore";
import { listSignalsForGoal } from "@/hooks/useSignalStore";
import { extractDocumentMetadata } from "@/lib/file-utils";
import { processDetectedSignals } from "@/lib/signal-processing";
import { prepareTextForSignalDetection } from "@/lib/signal-text";
import type { DashboardSchema, GoalMeta, GoalStatus, SignalRecord } from "@/types";

const mobileQuery = "(max-width: 767px)";
const subscribe = (cb: () => void) => {
  const mql = window.matchMedia(mobileQuery);
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
};
const getSnapshot = () => window.matchMedia(mobileQuery).matches;
const getServerSnapshot = () => false;

export default function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const {
    selectedModel,
    researchMode,
    webSearch,
    setActiveChatId,
    refreshChatList,
    refreshDocumentList,
    refreshGoalList,
    goalListVersion,
    pendingFiles,
  } = useApp();
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [goalMeta, setGoalMeta] = useState<GoalMeta | null>(null);
  const [goalTitle, setGoalTitle] = useState("");
  const [signals, setSignals] = useState<SignalRecord[]>([]);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [chatError, setChatError] = useState<{ message: string; code?: string } | null>(null);

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
    onError: async (error) => {
      try {
        // Try to parse structured error from API response
        const body = JSON.parse(error.message);
        if (body.code === "CONTEXT_OVERFLOW") {
          setChatError({
            message: "This conversation is very long. Older document content has been summarized to continue.",
            code: "CONTEXT_OVERFLOW",
          });
          return;
        }
      } catch {
        // Not a JSON error — fall through to generic
      }
      setChatError({ message: "Something went wrong. Please try again." });
    },
    onFinish: async ({ message }) => {
      setChatError(null);
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

      // Signal detection: self-detection for goal threads, cross-pollination for regular chats
      try {
        const responseText =
          message.parts
            ?.filter(
              (p): p is { type: "text"; text: string } => p.type === "text",
            )
            .map((p) => p.text)
            .join("") || "";

        if (responseText.length > 200) {
          let goalSummaries: { id: string; title: string; description: string; category: string; dashboardSchema?: DashboardSchema; existingActionItems?: string[]; existingInsights?: string[] }[] = [];

          if (goalMeta) {
            // Self-detection: goal thread analyzes its own messages
            if (goalMeta.status === "active" && goalMeta.dashboardSchema?.length) {
              const chat = await getChat(chatId);
              const activeActions = (goalMeta.actionItems || [])
                .filter((a) => !a.completed)
                .slice(0, 10)
                .map((a) => a.text);
              const activeInsights = (goalMeta.insights || [])
                .filter((i) => !i.dismissedAt)
                .slice(0, 10)
                .map((i) => i.text);
              goalSummaries = [{
                id: chatId,
                title: chat?.title || goalTitle,
                description: goalMeta.description,
                category: goalMeta.category || "",
                dashboardSchema: goalMeta.dashboardSchema,
                existingActionItems: activeActions.length > 0 ? activeActions : undefined,
                existingInsights: activeInsights.length > 0 ? activeInsights : undefined,
              }];
            }
          } else {
            // Cross-pollination: non-goal chats feed signals into active goals
            const activeGoals = await listGoals();
            const pollinateGoals = activeGoals.filter(
              (g) => g.goal?.status === "active" && g.goal?.crossPollinate,
            );
            goalSummaries = pollinateGoals.map((g) => {
              const activeActions = (g.goal!.actionItems || [])
                .filter((a) => !a.completed)
                .slice(0, 10)
                .map((a) => a.text);
              const activeInsights = (g.goal!.insights || [])
                .filter((i) => !i.dismissedAt)
                .slice(0, 10)
                .map((i) => i.text);
              return {
                id: g.id,
                title: g.title,
                description: g.goal!.description,
                category: g.goal!.category || "",
                dashboardSchema: g.goal!.dashboardSchema,
                existingActionItems: activeActions.length > 0 ? activeActions : undefined,
                existingInsights: activeInsights.length > 0 ? activeInsights : undefined,
              };
            });
          }

          if (goalSummaries.length > 0) {
            const resp = await fetch("/api/detect-signals", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                responseText: prepareTextForSignalDetection(responseText),
                goals: goalSummaries,
              }),
            });

            if (resp.ok) {
              const data = await resp.json();
              if (data.signals?.length > 0) {
                await processDetectedSignals(data.signals, chatId, message.id, refreshGoalList);
              }
            }
          }
        }
      } catch {
        // Non-critical — signal detection is best-effort
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
          // Retroactive self-scan: if goal has a dashboard but no signals yet,
          // scan the thread's own messages to populate dashboard values
          if (
            sigs.length === 0 &&
            chat.goal.dashboardSchema?.length &&
            chat.messages.length > 0
          ) {
            scanGoalThreadForSignals(chatId).then((count) => {
              if (count > 0) refreshGoalList();
            });
          }
        }
      }
      setInitialLoaded(true);
    }
    load();
  }, [chatId, setMessages]);

  // Re-fetch signals and GoalMeta when goalListVersion changes (e.g., after retroactive scan or dashboard value update)
  const isGoalThread = !!goalMeta;
  useEffect(() => {
    if (!isGoalThread) return;
    listSignalsForGoal(chatId).then(setSignals);
    getChat(chatId).then((chat) => {
      if (chat?.goal) setGoalMeta(chat.goal);
    });
  }, [goalListVersion, chatId, isGoalThread]);

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
      const disableCapture = newStatus !== "active";
      await updateGoalStatus(chatId, newStatus, disableCapture || undefined);
      setGoalMeta((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          status: newStatus,
          crossPollinate: disableCapture ? false : prev.crossPollinate,
        };
      });
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

  const handleToggleDashboard = useCallback(() => {
    setDashboardOpen((prev) => !prev);
  }, []);

  const handleSaveSchema = useCallback(
    async (newSchema: DashboardSchema) => {
      await setDashboardSchema(chatId, newSchema);
      setGoalMeta((prev) =>
        prev ? { ...prev, dashboardSchema: newSchema } : null,
      );
      refreshGoalList();
    },
    [chatId, refreshGoalList],
  );

  const handleSourceClick = useCallback(
    (signalId: string) => {
      const signal = signals.find((s) => s.id === signalId);
      if (signal) router.push(`/chat/${signal.sourceChatId}`);
    },
    [signals, router],
  );

  const handleToggleActionItem = useCallback(
    async (itemId: string) => {
      await toggleActionItem(chatId, itemId);
      // Refresh local goalMeta state
      const chat = await getChat(chatId);
      if (chat?.goal) setGoalMeta(chat.goal);
      refreshGoalList();
    },
    [chatId, refreshGoalList],
  );

  const handleDismissInsight = useCallback(
    async (insightId: string) => {
      await dismissInsight(chatId, insightId);
      const chat = await getChat(chatId);
      if (chat?.goal) setGoalMeta(chat.goal);
      refreshGoalList();
    },
    [chatId, refreshGoalList],
  );

  const hasDashboard = !!(goalMeta?.dashboardSchema && goalMeta.dashboardSchema.length > 0);

  return (
    <div className="flex h-full flex-col">
      {goalMeta && (
        <GoalSignalPanel
          title={goalTitle}
          goal={goalMeta}
          signals={signals}
          onStatusChange={handleStatusChange}
          onTogglePollinate={handleTogglePollinate}
          hasDashboard={hasDashboard}
          dashboardOpen={dashboardOpen}
          onToggleDashboard={handleToggleDashboard}
        />
      )}

      <div className="flex flex-1 min-h-0">
        {/* Chat area */}
        <div className="flex flex-1 min-w-0 flex-col">
          <ChatMessages messages={messages} isLoading={isLoading} />

          {chatError && (
            <div className="shrink-0 px-4">
              <div className="mx-auto max-w-2xl">
                <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  <span>{chatError.message}</span>
                  <button
                    onClick={() => setChatError(null)}
                    className="shrink-0 text-amber-600 hover:text-amber-800 transition-colors"
                    aria-label="Dismiss error"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          )}

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

        {/* Dashboard panel (single instance — desktop sidebar or mobile bottom sheet) */}
        {hasDashboard && dashboardOpen && (
          <GoalDashboardPanel
            schema={goalMeta!.dashboardSchema!}
            values={goalMeta!.dashboardValues || {}}
            actionItems={goalMeta!.actionItems}
            insights={goalMeta!.insights}
            onClose={handleToggleDashboard}
            onSaveSchema={handleSaveSchema}
            onToggleActionItem={handleToggleActionItem}
            onDismissInsight={handleDismissInsight}
            onSourceClick={handleSourceClick}
            isMobile={isMobile}
          />
        )}
      </div>
    </div>
  );
}
