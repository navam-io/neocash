"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type { FileUIPart } from "ai";
import { DEFAULT_MODEL } from "@/lib/constants";

interface AppContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  researchMode: boolean;
  setResearchMode: (on: boolean) => void;
  webSearch: boolean;
  setWebSearch: (on: boolean) => void;
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  chatListVersion: number;
  refreshChatList: () => void;
  documentListVersion: number;
  refreshDocumentList: () => void;
  goalListVersion: number;
  refreshGoalList: () => void;
  pendingFiles: React.RefObject<FileUIPart[]>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [researchMode, setResearchMode] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatListVersion, setChatListVersion] = useState(0);
  const [documentListVersion, setDocumentListVersion] = useState(0);
  const [goalListVersion, setGoalListVersion] = useState(0);
  const pendingFiles = useRef<FileUIPart[]>([]);

  const toggleSidebar = useCallback(
    () => setSidebarOpen((prev) => !prev),
    [],
  );
  const refreshChatList = useCallback(
    () => setChatListVersion((v) => v + 1),
    [],
  );
  const refreshDocumentList = useCallback(
    () => setDocumentListVersion((v) => v + 1),
    [],
  );
  const refreshGoalList = useCallback(
    () => setGoalListVersion((v) => v + 1),
    [],
  );

  return (
    <AppContext.Provider
      value={{
        sidebarOpen,
        toggleSidebar,
        setSidebarOpen,
        selectedModel,
        setSelectedModel,
        researchMode,
        setResearchMode,
        webSearch,
        setWebSearch,
        activeChatId,
        setActiveChatId,
        chatListVersion,
        refreshChatList,
        documentListVersion,
        refreshDocumentList,
        goalListVersion,
        refreshGoalList,
        pendingFiles,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
