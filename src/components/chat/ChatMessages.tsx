"use client";

import type { UIMessage } from "ai";
import { ChatMessage } from "./ChatMessage";
import { useScrollToBottom } from "@/hooks/useScrollToBottom";
import type { AgentId } from "@/lib/agent-profiles";

interface ChatMessagesProps {
  messages: UIMessage[];
  isLoading: boolean;
  agentId?: AgentId;
}

export function ChatMessages({ messages, isLoading, agentId }: ChatMessagesProps) {
  const { ref } = useScrollToBottom<HTMLDivElement>([messages, isLoading]);

  return (
    <div
      ref={ref}
      className="flex-1 overflow-y-auto px-4 py-6"
    >
      <div className="mx-auto max-w-2xl flex flex-col gap-6">
        {messages.map((message, i) => (
          <ChatMessage
            key={message.id}
            message={message}
            isLoading={
              isLoading &&
              i === messages.length - 1 &&
              message.role === "assistant"
            }
            agentId={message.role === "assistant" ? agentId : undefined}
          />
        ))}
      </div>
    </div>
  );
}
