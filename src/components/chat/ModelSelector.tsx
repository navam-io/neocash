"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { models, getModelName } from "@/lib/models";

export function ModelSelector() {
  const { selectedModel, setSelectedModel } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-text-tertiary transition-colors hover:text-text-secondary hover:bg-surface-hover"
      >
        {getModelName(selectedModel)}
        <ChevronDown size={12} />
      </button>

      {open && (
        <div
          className="absolute bottom-full left-0 mb-1 w-64 rounded-xl bg-surface p-1.5 z-50"
          style={{ boxShadow: "var(--shadow-dropdown)" }}
        >
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                setSelectedModel(model.id);
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-hover"
            >
              <div className="flex-1">
                <div className="text-sm font-medium text-text-primary">
                  {model.name}
                </div>
                <div className="text-xs text-text-tertiary">
                  {model.description}
                </div>
              </div>
              {selectedModel === model.id && (
                <Check size={16} className="text-accent shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
