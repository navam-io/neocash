"use client";

import { useEffect, useState, useCallback, useSyncExternalStore, use } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from "ai";
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
  updateGoalStatus,
  toggleCrossPollination,
  setDashboardSchema,
  toggleActionItem,
  dismissInsight,
} from "@/hooks/useGoalStore";
import { listSignalsForGoal } from "@/hooks/useSignalStore";
import { extractDocumentMetadata } from "@/lib/file-utils";
import { listAllMemories } from "@/hooks/useMemoryStore";
import { executeToolCall } from "@/lib/tool-executor";
import { WRITE_TOOLS, MEMORY_TOOLS, GOAL_TOOLS, type ToolName } from "@/lib/tool-schemas";
import type { DashboardSchema, GoalMeta, GoalStatus, MemoryRecord, SignalRecord } from "@/types";

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
    memoryListVersion,
    refreshMemoryList,
    pendingFiles,
  } = useApp();
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [goalMeta, setGoalMeta] = useState<GoalMeta | null>(null);
  const [goalTitle, setGoalTitle] = useState("");
  const [signals, setSignals] = useState<SignalRecord[]>([]);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [chatError, setChatError] = useState<{ message: string; code?: string } | null>(null);
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [recentlyCompleted, setRecentlyCompleted] = useState<Set<string>>(new Set());

  // Build transport body — include goalContext when this is a goal thread
  const baseBody = { model: selectedModel, researchMode, webSearch, memories };
  const transportBody = goalMeta
    ? {
        ...baseBody,
        goalContext: { title: goalTitle, goal: goalMeta, signals },
      }
    : baseBody;

  const { messages, sendMessage, stop, setMessages, status, addToolOutput } = useChat({
    id: chatId,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: transportBody,
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onToolCall: async ({ toolCall }) => {
      // Skip Anthropic built-in tools (web search) — handled by the provider
      if ("dynamic" in toolCall && toolCall.dynamic) return;

      try {
        const result = await executeToolCall(
          toolCall.toolName,
          toolCall.input as Record<string, unknown>,
          { chatId, messageId: "current" },
        );
        addToolOutput({
          tool: toolCall.toolName,
          toolCallId: toolCall.toolCallId,
          output: result,
        });
      } catch (err) {
        addToolOutput({
          tool: toolCall.toolName,
          toolCallId: toolCall.toolCallId,
          state: "output-error",
          errorText: String(err),
        });
      }

      // Refresh sidebar lists after write operations
      const name = toolCall.toolName as ToolName;
      if (WRITE_TOOLS.has(name)) {
        if (MEMORY_TOOLS.has(name)) refreshMemoryList();
        if (GOAL_TOOLS.has(name)) refreshGoalList();
      }
    },
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
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Set active chat
  useEffect(() => {
    setActiveChatId(chatId);
    return () => setActiveChatId(null);
  }, [chatId, setActiveChatId]);

  // Load memories from IndexedDB (refresh on memoryListVersion changes)
  useEffect(() => {
    listAllMemories().then(setMemories);
  }, [memoryListVersion]);

  // Load existing messages and goal context from IndexedDB
  useEffect(() => {
    async function load() {
      const mems = await listAllMemories();
      setMemories(mems);
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
            recentlyCompleted={recentlyCompleted}
            isMobile={isMobile}
          />
        )}
      </div>
    </div>
  );
}
