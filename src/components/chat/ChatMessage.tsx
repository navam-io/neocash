"use client";

import type { UIMessage } from "ai";
import { FileText, FileSpreadsheet, FileType, File } from "lucide-react";

import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { LoadingDots } from "@/components/ui/LoadingDots";
import { getFileCategory } from "@/lib/file-utils";

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

function getMessageDocuments(message: UIMessage): { mediaType: string; filename?: string }[] {
  if (!message.parts) return [];
  return message.parts
    .filter((p) => p.type === "file" && !p.mediaType.startsWith("image/"))
    .map((p) => ({ mediaType: (p as { mediaType: string }).mediaType, filename: (p as { filename?: string }).filename }));
}

function MessageDocIcon({ mediaType }: { mediaType: string }) {
  const cat = getFileCategory(mediaType);
  if (cat === "pdf") return <FileText size={14} className="text-red-500 shrink-0" />;
  if (cat === "excel" || cat === "csv") return <FileSpreadsheet size={14} className="text-green-600 shrink-0" />;
  if (cat === "word") return <FileType size={14} className="text-blue-500 shrink-0" />;
  return <File size={14} className="text-text-tertiary shrink-0" />;
}

export function ChatMessage({ message, isLoading }: ChatMessageProps) {
  const isUser = message.role === "user";
  const text = getMessageText(message);
  const images = isUser ? getMessageImages(message) : [];
  const documents = isUser ? getMessageDocuments(message) : [];

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
            {documents.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {documents.map((doc, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5"
                  >
                    <MessageDocIcon mediaType={doc.mediaType} />
                    <span className="text-xs text-text-secondary">
                      {doc.filename || "Document"}
                    </span>
                  </div>
                ))}
              </div>
            )}
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
