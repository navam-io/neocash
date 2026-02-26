"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  FileSpreadsheet,
  FileType,
  File,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { listUniqueDocuments } from "@/hooks/useDocumentStore";
import { getFileCategory } from "@/lib/file-utils";
import type { DocumentRecord } from "@/types";

function DocIcon({ mediaType }: { mediaType: string }) {
  const cat = getFileCategory(mediaType);
  if (cat === "pdf")
    return <FileText size={14} className="text-red-500 shrink-0" />;
  if (cat === "excel" || cat === "csv")
    return <FileSpreadsheet size={14} className="text-green-600 shrink-0" />;
  if (cat === "word")
    return <FileType size={14} className="text-blue-500 shrink-0" />;
  return <File size={14} className="text-text-tertiary shrink-0" />;
}

export function DocumentList() {
  const { documentListVersion } = useApp();
  const router = useRouter();
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    listUniqueDocuments().then(setDocs);
  }, [documentListVersion]);

  if (docs.length === 0) return null;

  return (
    <div className="py-2">
      {/* Section header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center gap-1 px-3 pb-1 text-xs font-medium text-text-tertiary uppercase tracking-wider hover:text-text-secondary transition-colors"
      >
        {collapsed ? (
          <ChevronRight size={12} />
        ) : (
          <ChevronDown size={12} />
        )}
        <span>Documents</span>
        <span className="ml-auto text-[10px] font-normal tabular-nums">
          {docs.length}
        </span>
      </button>

      {/* Document items */}
      {!collapsed && (
        <nav
          className="flex flex-col gap-0.5 px-2 max-h-[200px] overflow-y-auto"
          aria-label="Documents"
        >
          {docs.map((doc) => (
            <button
              key={doc.id}
              onClick={() => router.push(`/chat/${doc.chatId}`)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-sidebar-hover group"
            >
              <DocIcon mediaType={doc.mediaType} />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-text-secondary truncate">
                  {doc.filename}
                </p>
                {doc.metadata && (
                  <p className="text-xs text-text-tertiary truncate">
                    {doc.metadata}
                  </p>
                )}
              </div>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
