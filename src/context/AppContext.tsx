"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { DEFAULT_MODEL } from "@/lib/constants";

interface AppContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  chatListVersion: number;
  refreshChatList: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatListVersion, setChatListVersion] = useState(0);

  const toggleSidebar = useCallback(
    () => setSidebarOpen((prev) => !prev),
    [],
  );
  const refreshChatList = useCallback(
    () => setChatListVersion((v) => v + 1),
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
        activeChatId,
        setActiveChatId,
        chatListVersion,
        refreshChatList,
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
