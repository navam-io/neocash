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
  Trash2,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { listUniqueDocuments, deleteDocument } from "@/hooks/useDocumentStore";
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
  const { documentListVersion, refreshDocumentList } = useApp();
  const router = useRouter();
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => {
    listUniqueDocuments().then(setDocs);
  }, [documentListVersion]);

  async function handleDelete(id: string) {
    await deleteDocument(id);
    setConfirmingId(null);
    refreshDocumentList();
  }

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
          {docs.map((doc) =>
            confirmingId === doc.id ? (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 bg-red-50 text-sm"
              >
                <span className="text-red-700 truncate text-xs">Delete?</span>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => setConfirmingId(null)}
                    className="text-xs text-text-secondary hover:text-text-primary px-1.5 py-0.5"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="text-xs text-red-600 font-medium hover:text-red-700 px-1.5 py-0.5"
                  >
                    Yes
                  </button>
                </div>
              </div>
            ) : (
              <div key={doc.id} className="group relative flex items-center">
                <button
                  onClick={() => router.push(`/chat/${doc.chatId}`)}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-sidebar-hover w-full"
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
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmingId(doc.id);
                  }}
                  className="absolute right-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-100"
                  aria-label="Delete document"
                >
                  <Trash2 size={12} className="text-text-tertiary hover:text-red-500" />
                </button>
              </div>
            ),
          )}
        </nav>
      )}
    </div>
  );
}
