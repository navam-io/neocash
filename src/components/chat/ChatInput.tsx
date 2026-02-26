"use client";

import { useState, useRef, useEffect } from "react";
import { X, Lightbulb, Globe } from "lucide-react";
import type { FileUIPart } from "ai";
import { convertFileListToFileUIParts } from "ai";
import { ModelSelector } from "./ModelSelector";
import { SendButton } from "./SendButton";
import { ContextMenu } from "./UploadButton";
import { useApp } from "@/context/AppContext";
import { APP_PLACEHOLDER } from "@/lib/constants";

interface ChatInputProps {
  onSend: (text: string, files?: FileUIPart[]) => void;
  onStop?: () => void;
  isLoading?: boolean;
  autoFocus?: boolean;
  initialValue?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export function ChatInput({
  onSend,
  onStop,
  isLoading = false,
  autoFocus = true,
  initialValue = "",
  value: controlledValue,
  onChange: controlledOnChange,
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
    const parts = await convertFileListToFileUIParts(fileList);
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
        <div className="px-4 pt-3 pb-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={APP_PLACEHOLDER}
            rows={1}
            className="chat-textarea w-full bg-transparent text-text-primary placeholder:text-text-placeholder outline-none"
            style={{ fontWeight: 430 }}
          />
        </div>

        {/* Preview/indicator area */}
        {(hasAttachments || hasModesActive) && (
          <div className="flex flex-wrap items-center gap-2 px-4 pb-2">
            {/* Image thumbnails */}
            {attachedFiles.map((file, i) => (
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
            ))}

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
