# Thinking UI

Render extended thinking and reasoning parts to the user, matching Claude AI's thinking interface.

## Current State

- Extended thinking is enabled in research mode (10k token budget via `providerOptions`)
- `ChatMessage.tsx` line 206 skips `step-start`, `reasoning`, and other non-text/tool parts
- Users get no visibility into when/why the model is reasoning

## Goals

### 1. Render Thinking Indicators

- Show a "Thinking..." indicator when the model enters a reasoning step (like Claude AI)
- Animate the indicator during streaming (pulsing copper accent)
- Collapse thinking blocks after completion — expandable on click
- Support `step-start` parts as section dividers in multi-step reasoning

### 2. Reasoning Block Display

- Render `reasoning` parts in a styled container (muted text, italic, left border)
- Distinguish thinking content from response content visually
- Truncate long reasoning blocks with "Show full reasoning" toggle

### 3. Adaptive Thinking Budget

- Replace fixed 10k token budget with query-complexity-based allocation
- Simple factual queries → no extended thinking
- Multi-step financial analysis → higher budget (up to 16k)
- Use message content heuristics or a lightweight classifier to estimate complexity
- Reference: https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking

## Design Notes

- Thinking UI should feel native to the existing chat — copper accent, same typography
- Don't show thinking for simple responses (only when model actually reasons)
- Consider `prefers-reduced-motion` for thinking animations
