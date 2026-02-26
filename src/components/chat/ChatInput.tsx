"use client";

import { useState, useRef, useEffect } from "react";
import { X, Lightbulb, Globe, FileText, FileSpreadsheet, FileType, File } from "lucide-react";
import type { FileUIPart } from "ai";
import { convertFileListToFileUIParts } from "ai";
import { ModelSelector } from "./ModelSelector";
import { SendButton } from "./SendButton";
import { ContextMenu } from "./UploadButton";
import { useApp } from "@/context/AppContext";
import { APP_PLACEHOLDER } from "@/lib/constants";
import { validateFileSize, getFileCategory } from "@/lib/file-utils";

function DocIcon({ mediaType, size = 14 }: { mediaType: string; size?: number }) {
  const cat = getFileCategory(mediaType);
  if (cat === "pdf") return <FileText size={size} className="text-red-500 shrink-0" />;
  if (cat === "excel" || cat === "csv") return <FileSpreadsheet size={size} className="text-green-600 shrink-0" />;
  if (cat === "word") return <FileType size={size} className="text-blue-500 shrink-0" />;
  return <File size={size} className="text-text-tertiary shrink-0" />;
}

interface ChatInputProps {
  onSend: (text: string, files?: FileUIPart[]) => void;
  onStop?: () => void;
  isLoading?: boolean;
  autoFocus?: boolean;
  initialValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  previewText?: string;
}

export function ChatInput({
  onSend,
  onStop,
  isLoading = false,
  autoFocus = true,
  initialValue = "",
  value: controlledValue,
  onChange: controlledOnChange,
  previewText = "",
}: ChatInputProps) {
  const { researchMode, webSearch } = useApp();
  const isControlled = controlledValue !== undefined && controlledOnChange !== undefined;
  const [internalValue, setInternalValue] = useState(initialValue);
  const [attachedFiles, setAttachedFiles] = useState<FileUIPart[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const value = isControlled ? controlledValue : internalValue;
  const setValue = isControlled ? controlledOnChange : setInternalValue;

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Focus textarea when value is pre-filled from parent
  useEffect(() => {
    if (isControlled && controlledValue && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isControlled, controlledValue]);

  const hasContent = value.trim().length > 0;
  const hasAttachments = attachedFiles.length > 0;
  const hasModesActive = researchMode || webSearch;

  async function handleFileSelect(fileList: FileList) {
    const validFiles: File[] = [];
    for (const file of Array.from(fileList)) {
      const error = validateFileSize(file);
      if (error) {
        console.warn(error);
        continue;
      }
      validFiles.push(file);
    }
    if (validFiles.length === 0) return;
    const dt = new DataTransfer();
    validFiles.forEach((f) => dt.items.add(f));
    const parts = await convertFileListToFileUIParts(dt.files);
    setAttachedFiles((prev) => [...prev, ...parts]);
  }

  function removeFile(index: number) {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function doSend() {
    if ((hasContent || hasAttachments) && !isLoading) {
      onSend(value.trim(), hasAttachments ? attachedFiles : undefined);
      setValue("");
      setAttachedFiles([]);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      doSend();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    doSend();
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className="rounded-[20px] bg-surface"
        style={{ boxShadow: "var(--shadow-input)" }}
      >
        {/* Textarea area */}
        <div className="relative px-4 pt-3 pb-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={previewText ? "" : APP_PLACEHOLDER}
            rows={1}
            className="chat-textarea w-full bg-transparent text-text-primary placeholder:text-text-placeholder outline-none"
            style={{ fontWeight: 430 }}
          />
          {previewText && !value && (
            <div className="pointer-events-none absolute inset-0 px-4 pt-3 pb-1">
              <div
                className="preview-clamp text-text-placeholder break-words"
                style={{ fontWeight: 430 }}
              >
                {previewText}
              </div>
            </div>
          )}
        </div>

        {/* Preview/indicator area */}
        {(hasAttachments || hasModesActive) && (
          <div className="flex flex-wrap items-center gap-2 px-4 pb-2">
            {/* File previews: images as thumbnails, documents as pills */}
            {attachedFiles.map((file, i) => {
              const isImage = file.mediaType.startsWith("image/");
              return isImage ? (
                <div
                  key={i}
                  className="relative group rounded-lg overflow-hidden border border-border"
                >
                  <img
                    src={file.url}
                    alt={file.filename || "Attached image"}
                    className="h-12 w-12 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-text-primary text-text-inverse opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={10} />
                  </button>
                </div>
              ) : (
                <div
                  key={i}
                  className="group flex items-center gap-1.5 rounded-lg border border-border bg-surface-hover px-2.5 py-1.5"
                >
                  <DocIcon mediaType={file.mediaType} />
                  <span className="text-xs text-text-secondary max-w-[120px] truncate">
                    {file.filename || "Document"}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="flex h-4 w-4 items-center justify-center rounded-full text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity hover:text-text-primary"
                  >
                    <X size={10} />
                  </button>
                </div>
              );
            })}

            {/* Mode pills */}
            {researchMode && (
              <span className="flex items-center gap-1.5 rounded-lg bg-surface-hover px-2.5 py-1 text-xs text-text-tertiary">
                <Lightbulb size={12} />
                Research
              </span>
            )}
            {webSearch && (
              <span className="flex items-center gap-1.5 rounded-lg bg-surface-hover px-2.5 py-1 text-xs text-text-tertiary">
                <Globe size={12} />
                Web search
              </span>
            )}
          </div>
        )}

        {/* Bottom bar: context menu | model selector + send button */}
        <div className="flex items-center justify-between px-3 pb-2.5">
          <div className="flex items-center gap-1">
            <ContextMenu onFileSelect={handleFileSelect} />
          </div>
          <div className="flex items-center gap-1">
            <ModelSelector />
            {(hasContent || hasAttachments || isLoading) && (
              <SendButton
                isLoading={isLoading}
                hasContent={hasContent || hasAttachments}
                onStop={onStop}
              />
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
