"use client";

import { useState, useRef, useEffect } from "react";
import { ModelSelector } from "./ModelSelector";
import { SendButton } from "./SendButton";
import { UploadButton } from "./UploadButton";
import { APP_PLACEHOLDER } from "@/lib/constants";

interface ChatInputProps {
  onSend: (text: string) => void;
  onStop?: () => void;
  isLoading?: boolean;
  autoFocus?: boolean;
  initialValue?: string;
}

export function ChatInput({
  onSend,
  onStop,
  isLoading = false,
  autoFocus = true,
  initialValue = "",
}: ChatInputProps) {
  const [value, setValue] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading) {
        onSend(value.trim());
        setValue("");
      }
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (value.trim() && !isLoading) {
      onSend(value.trim());
      setValue("");
    }
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

        {/* Bottom bar: upload + model selector | send button */}
        <div className="flex items-center justify-between px-3 pb-2.5">
          <div className="flex items-center gap-1">
            <UploadButton />
            <ModelSelector />
          </div>
          <SendButton
            isLoading={isLoading}
            hasContent={value.trim().length > 0}
            onStop={onStop}
          />
        </div>
      </div>
    </form>
  );
}
