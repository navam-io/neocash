# Data Management

Inline delete, full reset, and sample data loading for NeoCash.

## Features

### Inline Delete
- Hover-to-reveal trash icon on every sidebar item (Chats, Goals, Documents)
- Click trash → inline "Delete? [Cancel] [Yes]" confirmation (no modal)
- Cascade-aware deletes:
  - **Chat** → deletes associated documents
  - **Goal** → deletes associated signals, documents, and the chat record
  - **Document** → single delete, no cascade
- If deleted item was the active chat, navigate to home `/`
- All affected sidebar lists refresh immediately

### Reset All Data
- Accessed via user profile menu (click "Personal" pill at bottom of sidebar)
- Two-step inline confirm: "Delete everything? [Cancel] [Reset]"
- Clears all chats, goals, signals, and documents from IndexedDB
- Refreshes all sidebar lists and navigates to home

### Load Sample Data
- Accessed via same user profile menu
- Two-step inline confirm: "Replace all data? [Cancel] [Load]"
- Clears existing data first, then hydrates with fictional wealth management data
- Sample content: 3 chats, 2 goals, 3 signals, 3 documents
- All data is fictional (no PII), safe for screenshots and demos
- Documents are metadata-only (no file bytes stored)

## Key Files

| File | Role |
|------|------|
| `src/hooks/useChatHistory.ts` | `clearAllChats()`, `deleteChatWithCascade()` |
| `src/hooks/useGoalStore.ts` | `deleteGoal()` with cascade |
| `src/hooks/useSignalStore.ts` | `clearAllSignals()` |
| `src/hooks/useDocumentStore.ts` | `clearAllDocuments()` |
| `src/components/layout/ChatList.tsx` | Inline delete for chats |
| `src/components/layout/GoalList.tsx` | Inline delete for goals |
| `src/components/layout/DocumentList.tsx` | Inline delete for documents |
| `src/components/layout/UserProfile.tsx` | Profile menu with Reset + Load Sample |
| `src/lib/sample-data.ts` | Hardcoded sample data + `loadSampleData()` |
