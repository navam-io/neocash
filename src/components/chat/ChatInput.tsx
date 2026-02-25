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
  const isControlled = controlledValue !== undefined && controlledOnChange !== undefined;
  const [internalValue, setInternalValue] = useState(initialValue);
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

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (hasContent && !isLoading) {
        onSend(value.trim());
        setValue("");
      }
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (hasContent && !isLoading) {
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

        {/* Bottom bar: upload | model selector + send button */}
        <div className="flex items-center justify-between px-3 pb-2.5">
          <div className="flex items-center gap-1">
            <UploadButton />
          </div>
          <div className="flex items-center gap-1">
            <ModelSelector />
            {(hasContent || isLoading) && (
              <SendButton
                isLoading={isLoading}
                hasContent={hasContent}
                onStop={onStop}
              />
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
