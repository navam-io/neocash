# Improve Goals

Refer wealth-goals intent and related feature code for context.

## UX Fixes

1. **Click-outside-to-dismiss** — Goals dropdown on new chat screen should close when clicking outside it.
2. **Show existing goals in dropdown** — If user has already created goals, render them in the Goals dropdown with goal icon prefix and signal count pill. Clicking navigates to the goal thread (does not duplicate). Predefined prompts appear below existing goals.
3. **Move "+" to Goals tab** — Add a "+" icon next to the Goals button on the new chat screen with same behavior as the sidebar "+" (opens goal creation form). Remove the "+" icon from the Goals sidebar section.
4. **Rename "Cross-pollinate" → "Capture signals"** — In the goal signal panel at top of goal threads.
5. **Disable signal capture when paused/completed** — When goal status is changed to paused or completed, the "Capture signals" toggle should gray out and signal detection should stop for that goal.

## Signal Quality

6. **Enrich goal description field** — Goal creation form (the "+" form) should have: title, detailed prompt (textarea), and optional category. A "Generate" button uses Haiku to create a structured detailed prompt from the title alone — similar to how predefined goals have a short title and a rich prompt behind it. User can review and edit the generated prompt before saving. Description is set once at creation, not editable after.

   The description flows into three places:
   - `GoalMeta.description` — stored in IndexedDB (currently just copies title, wasted)
   - `/api/detect-signals` Haiku prompt — for richer signal matching (currently description is sent but ignored in the prompt)
   - First chat message — as the kickoff that shapes AI's structured response (currently generic for "+" form goals)

7. **Fix detect-signals API to use description** — Include the goal description in the Haiku prompt alongside title and category. Currently the API receives description in the request but only puts title and category in the Claude prompt.

## Discoverability

8. **Visual distinction for custom goals** — User-defined goals should have a different colored icon prefix from predefined goals, visible in both the new chat dropdown and sidebar.
9. **Hover-to-preview prompt** — When a goal is hovered in the new chat dropdown, show the related detailed prompt in the prompt box in gray to indicate it is not editable, but so the user knows what prompt will run.
