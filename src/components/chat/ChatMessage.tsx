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

function getMessageImages(message: UIMessage): { url: string; filename?: string }[] {
  if (!message.parts) return [];
  return message.parts
    .filter((p) => p.type === "file" && p.mediaType.startsWith("image/"))
    .map((p) => ({ url: (p as { url: string; filename?: string }).url, filename: (p as { filename?: string }).filename }));
}

export function ChatMessage({ message, isLoading }: ChatMessageProps) {
  const isUser = message.role === "user";
  const text = getMessageText(message);
  const images = isUser ? getMessageImages(message) : [];

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
          <>
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {images.map((img, i) => (
                  <img
                    key={i}
                    src={img.url}
                    alt={img.filename || "Attached image"}
                    className="max-h-48 rounded-lg"
                  />
                ))}
              </div>
            )}
            {text && (
              <p className="text-text-primary whitespace-pre-wrap">{text}</p>
            )}
          </>
        ) : isLoading && !text ? (
          <LoadingDots />
        ) : (
          <MarkdownRenderer content={text} />
        )}
      </div>
    </div>
  );
}
