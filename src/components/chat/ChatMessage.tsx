"use client";

import { useState } from "react";
import type { UIMessage } from "ai";
import { isToolOrDynamicToolUIPart, isReasoningUIPart } from "ai";
import { FileText, FileSpreadsheet, FileType, File, Globe, ChevronDown } from "lucide-react";

import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { LoadingDots } from "@/components/ui/LoadingDots";
import { ToolCallChip } from "@/components/chat/ToolCallChip";
import { ToolCallGroup } from "@/components/chat/ToolCallGroup";
import { ThinkingBlock } from "@/components/chat/ThinkingBlock";
import { getFileCategory } from "@/lib/file-utils";

// ─── Source Citation Helpers ─────────────────────

interface SourceInfo {
  url: string;
  title?: string;
}

function getMessageSources(message: UIMessage): SourceInfo[] {
  if (!message.parts) return [];
  const seen = new Set<string>();
  const sources: SourceInfo[] = [];
  for (const part of message.parts) {
    if (part.type === "source-url" && part.url && !seen.has(part.url)) {
      seen.add(part.url);
      sources.push({ url: part.url, title: part.title });
    }
  }
  return sources;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

const MAX_VISIBLE_SOURCES = 10;

function SourcesCitation({ sources }: { sources: SourceInfo[] }) {
  const [expanded, setExpanded] = useState(false);

  if (sources.length === 0) return null;

  const visible = expanded ? sources : sources.slice(0, MAX_VISIBLE_SOURCES);
  const hasMore = sources.length > MAX_VISIBLE_SOURCES;

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <div className="flex items-center gap-1.5 mb-2 text-text-secondary text-xs font-medium">
        <Globe size={13} />
        <span>Sources</span>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {visible.map((source, i) => (
          <a
            key={source.url}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-md border border-border bg-surface-hover px-2 py-0.5 text-xs text-accent hover:bg-surface-hover/80 transition-colors no-underline min-w-0"
          >
            <span className="text-text-tertiary font-mono text-[10px] shrink-0">{i + 1}</span>
            <span className="truncate">
              {source.title || getDomain(source.url)}
            </span>
          </a>
        ))}
        {hasMore && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="flex items-center justify-center gap-0.5 rounded-md border border-border px-2 py-0.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            +{sources.length - MAX_VISIBLE_SOURCES} more
            <ChevronDown size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Message Helpers ─────────────────────────────

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

// ─── Tool Part Helpers ───────────────────────────

type MessagePart = UIMessage["parts"][number];

function hasNonTextParts(message: UIMessage): boolean {
  return message.parts?.some((p) =>
    isToolOrDynamicToolUIPart(p) ||
    p.type === "reasoning" ||
    p.type === "source-url"
  ) ?? false;
}

function getToolInfo(part: MessagePart): {
  toolName: string;
  toolCallId: string;
  state: string;
  input: unknown;
  output: unknown;
  isError: boolean;
} | null {
  if (isToolOrDynamicToolUIPart(part)) {
    // Static tool parts have type "tool-<name>", dynamic have type "dynamic-tool"
    const toolName =
      part.type === "dynamic-tool"
        ? part.toolName
        : part.type.replace(/^tool-/, "");
    const output = "output" in part ? part.output : undefined;
    const isError = part.state === "output-error" || (part.state === "output-available" && output != null && typeof output === "object" && "error" in (output as Record<string, unknown>));
    return {
      toolName,
      toolCallId: part.toolCallId,
      state: part.state,
      input: part.input,
      output,
      isError,
    };
  }
  return null;
}

// ─── Parts-Based Rendering for Assistant Messages ─

function AssistantParts({ parts, streamActive }: { parts: MessagePart[]; streamActive?: boolean }) {
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < parts.length) {
    const part = parts[i];

    if (part.type === "text" && part.text) {
      elements.push(
        <MarkdownRenderer key={`text-${i}`} content={part.text} />,
      );
      i++;
    } else if (isToolOrDynamicToolUIPart(part)) {
      // Group consecutive tool parts
      const toolParts: { info: NonNullable<ReturnType<typeof getToolInfo>>; index: number }[] = [];
      while (i < parts.length && isToolOrDynamicToolUIPart(parts[i])) {
        const info = getToolInfo(parts[i]);
        if (info) toolParts.push({ info, index: i });
        i++;
      }

      const chips = toolParts.map(({ info, index }) => (
        <ToolCallChip
          key={`tool-${index}`}
          toolName={info.toolName}
          state={info.state}
          input={info.input}
          output={info.output}
          isError={info.isError}
          stale={!streamActive}
        />
      ));

      if (chips.length > 1) {
        elements.push(
          <ToolCallGroup key={`group-${toolParts[0].index}`}>
            {chips}
          </ToolCallGroup>,
        );
      } else {
        elements.push(chips[0]);
      }
    } else if (part.type === "reasoning") {
      elements.push(
        <ThinkingBlock key={`reasoning-${i}`} text={part.text} state={part.state} />
      );
      i++;
    } else if (part.type === "step-start") {
      i++; // Skip step boundaries — reasoning blocks + tool chips provide sufficient structure
    } else {
      // Skip other part types (source-url, etc.)
      i++;
    }
  }

  return <>{elements}</>;
}

// ─── Main Component ──────────────────────────────

export function ChatMessage({ message, isLoading }: ChatMessageProps) {
  const isUser = message.role === "user";
  const text = getMessageText(message);
  const images = isUser ? getMessageImages(message) : [];
  const documents = isUser ? getMessageDocuments(message) : [];
  const sources = isUser ? [] : getMessageSources(message);

  // Assistant messages with tool/reasoning/source parts use parts-based rendering
  const usePartsRendering = !isUser && hasNonTextParts(message);

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
        ) : usePartsRendering ? (
          <>
            <AssistantParts parts={message.parts} streamActive={isLoading} />
            {isLoading && !text && !message.parts?.some(p => p.type === "reasoning") && <LoadingDots />}
            <SourcesCitation sources={sources} />
          </>
        ) : isLoading && !text ? (
          <LoadingDots />
        ) : (
          <>
            <MarkdownRenderer content={text} />
            <SourcesCitation sources={sources} />
          </>
        )}
      </div>
    </div>
  );
}
