"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Image, FileText, Lightbulb, Globe, Check } from "lucide-react";
import { DOCUMENT_ACCEPT } from "@/lib/file-utils";
import { useApp } from "@/context/AppContext";

interface ContextMenuProps {
  onFileSelect: (files: FileList) => void;
}

export function ContextMenu({ onFileSelect }: ContextMenuProps) {
  const { researchMode, setResearchMode, webSearch, setWebSearch } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Add context"
        onClick={() => setOpen(!open)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-text-tertiary transition-colors hover:text-text-secondary hover:bg-surface-hover"
      >
        <Plus size={18} />
      </button>

      {open && (
        <div
          className="absolute bottom-full left-0 mb-1 w-56 rounded-xl bg-surface p-1.5 z-50"
          style={{ boxShadow: "var(--shadow-dropdown)" }}
        >
          {/* Add images */}
          <button
            type="button"
            onClick={() => {
              fileInputRef.current?.click();
              setOpen(false);
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-hover"
          >
            <Image size={16} className="text-text-tertiary shrink-0" />
            <span className="text-sm text-text-primary">Add images</span>
          </button>

          {/* Add documents */}
          <button
            type="button"
            onClick={() => {
              docInputRef.current?.click();
              setOpen(false);
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-hover"
          >
            <FileText size={16} className="text-text-tertiary shrink-0" />
            <span className="text-sm text-text-primary">Add documents</span>
          </button>

          {/* Research mode */}
          <button
            type="button"
            onClick={() => {
              setResearchMode(!researchMode);
              setOpen(false);
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-hover"
          >
            <Lightbulb size={16} className="text-text-tertiary shrink-0" />
            <span className="flex-1 text-sm text-text-primary">Research mode</span>
            {researchMode && (
              <Check size={16} className="text-accent shrink-0" />
            )}
          </button>

          {/* Web search */}
          <button
            type="button"
            onClick={() => {
              setWebSearch(!webSearch);
              setOpen(false);
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-hover"
          >
            <Globe size={16} className="text-text-tertiary shrink-0" />
            <span className="flex-1 text-sm text-text-primary">Search the web</span>
            {webSearch && (
              <Check size={16} className="text-accent shrink-0" />
            )}
          </button>
        </div>
      )}

      {/* Hidden file input for images */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onFileSelect(e.target.files);
          }
          e.target.value = "";
        }}
      />

      {/* Hidden file input for documents */}
      <input
        ref={docInputRef}
        type="file"
        accept={DOCUMENT_ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onFileSelect(e.target.files);
          }
          e.target.value = "";
        }}
      />
    </div>
  );
}
