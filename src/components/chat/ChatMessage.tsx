"use client";

import type { UIMessage } from "ai";

import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { LoadingDots } from "@/components/ui/LoadingDots";

interface ChatMessageProps {
  message: UIMessage;
  isLoading?: boolean;
}

function getMessageText(message: UIMessage): string {
  if (message.parts) {
    return message.parts
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("");
  }
  return "";
}

export function ChatMessage({ message, isLoading }: ChatMessageProps) {
  const isUser = message.role === "user";
  const text = getMessageText(message);

  return (
    <div className={`w-full ${isUser ? "flex justify-end" : ""}`}>
      <div
        className={
          isUser
            ? "rounded-2xl bg-surface-hover px-4 py-2.5"
            : "min-w-0"
        }
        style={
          isUser
            ? { boxShadow: "var(--shadow-message)" }
            : undefined
        }
      >
        {isUser ? (
          <p className="text-text-primary whitespace-pre-wrap">{text}</p>
        ) : isLoading && !text ? (
          <LoadingDots />
        ) : (
          <MarkdownRenderer content={text} />
        )}
      </div>
    </div>
  );
}
