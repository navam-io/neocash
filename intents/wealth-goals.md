
Study the project code, review the UI in browser. brainstorm with me the most tasteful, elegant, efficient, accurate, and user friendly way to design and build the next feature. NeoCash is a wealth management goals driven app. User may have several goals like prepare for tax filing season, balance their portfolio of investments, receive recommendation of next stock to invest based on their personal financial situation and preferences like risk appetite, etc. User goals may be informed by certain inputs. These inputs may "arrive" over time as user converses with NeoChat, uploads documents, shares images of bills, performs a research, searches for some topic, or run up a suggested prompt. Recommend five unique ways to build this goals driven wealth management feature. Provide description of how the feature will behave based on existing functionality of the app and rationale why we should select this feature. Then objectively review all five options and make your final informed and expert recommendation. Once developer confirms, append this intent with the recommended feature.

---

## Recommended Feature: Goal Threads

**Selected approach:** Goals as persistent, pinned chat threads that accumulate context over time with AI-powered cross-pollination.

### Description

Goal Threads turns financial goals into first-class citizens within NeoCash. Each goal is a persistent chat thread — a focused conversation with the AI advisor that stays pinned in the sidebar, accumulating context and signals over time. When users chat in regular threads about topics relevant to their active goals, the AI auto-detects the relevance and cross-pollinates insights into the goal thread.

### Key Behaviors

1. **Goal Creation** — Two paths: sidebar "+" button with inline form, or selecting a prompt from the new "Goals" category tab
2. **Goal Threads** — Persistent chat threads with goal-specific system prompts that keep the AI focused on the objective
3. **Goal Signal Panel** — A compact HUD at the top of goal chats showing status, cross-pollination toggle, and collected signals
4. **Cross-Pollination** — After each AI response in regular chats, Haiku analyzes if it's relevant to active goals and saves signals
5. **Sidebar Integration** — Goals section between Documents and Chats with status dots, signal counts, and copper Target icons

### Rationale

This approach maximizes value from existing infrastructure (chat system, IndexedDB, Vercel AI SDK) while adding genuinely intelligent behavior. Goals as chat threads means zero new UI paradigms for users to learn — they already know how to chat. Cross-pollination makes NeoCash feel like it actually remembers your objectives across conversations, which is the key differentiator for a wealth management advisor.