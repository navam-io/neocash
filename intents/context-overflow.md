# Context Overflow

Message windowing and error handling for conversations that exceed the Anthropic API's ~200K token context window.

## Problem

Goal threads accumulate documents over time (W2s, 1099s, RSU records). All messages -- including base64 document content -- were re-sent on every turn. A tax filing goal with 9 documents exceeded the context window, causing the thread to silently stop responding.

## Approach

"Lossless-recent, lossy-old" message windowing. Keep the last N messages fully intact; for older messages, replace `file` parts with text placeholders like `[Previously uploaded: filename.pdf]`. Token estimation at ~4 chars/token for text, with base64 size calculation for files.

## Implementation

### Message Windowing
- `prepareMessagesForAPI()` in `message-windowing.ts` applies a 160K token budget
- Recent messages preserved with full file content
- Older messages get file parts replaced with descriptive placeholders
- Token estimation handles both text and base64 file parts

### Error Handling
- Anthropic SDK context overflow errors detected in API route
- Structured error response with `code: "CONTEXT_OVERFLOW"` and HTTP 413
- Dismissible amber warning banner above chat input
- `chatError` state with `onError` callback on `useChat()`
- Error clears on next successful `onFinish`

## Key Files

| File | Role |
|------|------|
| `src/lib/message-windowing.ts` | `prepareMessagesForAPI()` with token budget windowing |
| `src/app/api/chat/route.ts` | Applies windowing before API call, catches overflow errors |
| `src/app/chat/[chatId]/page.tsx` | `chatError` state, error banner UI |
