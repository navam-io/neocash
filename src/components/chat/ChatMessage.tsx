"use client";

import type { UIMessage } from "ai";
import { User } from "lucide-react";
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
    <div className={`flex gap-3 ${isUser ? "justify-end" : ""}`}>
      {!isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-light mt-0.5">
          <span className="text-accent text-xs font-bold">N</span>
        </div>
      )}

      <div
        className={`max-w-[85%] ${
          isUser
            ? "rounded-2xl bg-surface-hover px-4 py-2.5"
            : "flex-1 min-w-0"
        }`}
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

      {isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-text-primary mt-0.5">
          <User size={14} className="text-text-inverse" />
        </div>
      )}
    </div>
  );
}
