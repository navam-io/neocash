# Goal Dashboard

## Summary

Goal Dashboard adds structured, LLM-generated metric tracking to goal threads. When a user creates a goal, Haiku analyzes the title and description to generate a typed schema of 3-8 key attributes (e.g., "Total Income" as currency, "Filing Deadline" as date, "Documents Gathered" as boolean). As signals arrive from cross-pollinated conversations, the detection pipeline also extracts concrete values for these attributes, automatically populating the dashboard.

## User Experience

The dashboard renders as a **right-side detail panel** (320px) alongside the goal chat thread, creating a split-view: sidebar | chat | dashboard. A toggle button (LayoutDashboard icon) in the GoalSignalPanel opens/closes the panel. On mobile (<768px), the dashboard opens as a bottom sheet overlay.

Each attribute displays type-appropriate formatting — currency with $, percentages with %, dates in locale format, booleans as check/X icons. Empty attributes show "--" until a signal populates them. A completion indicator ("3 of 5 tracked") gives at-a-glance progress.

Users can edit the schema: rename attributes, change types, add or remove attributes (max 8). The editor replaces the panel content inline — no modals.

## Data Architecture

- **Schema**: Stored on `GoalMeta.dashboardSchema` (array of typed attribute definitions)
- **Values**: Stored on `GoalMeta.dashboardValues` (map of attribute ID → value + source signal)
- **Signal enhancement**: `SignalRecord.extractedValues` carries structured key-value pairs matching the dashboard schema
- **No new IndexedDB prefix** — co-located with goal data for atomic reads and cascade deletes

## Flows

**Schema generation**: Goal created → fire-and-forget call to `/api/generate-dashboard-schema` → Haiku returns typed attributes → stored on GoalMeta

**Value population**: Regular chat response → `/api/detect-signals` (now schema-aware) → returns signals with `extractedValues` → values merged into `GoalMeta.dashboardValues`

**System prompt awareness**: Goal thread AI sees current dashboard state (which values are known, which are missing) and can proactively ask about gaps

## Supported Attribute Types

currency, percent, date, text, boolean, number — each with type-specific rendering and formatting

## Backward Compatibility

Goals created before this feature have no `dashboardSchema`, so the toggle button doesn't appear and behavior is unchanged. Existing signals without `extractedValues` continue to work normally.

## User Personas

- **Tax optimizer**: Dashboard tracks income, withholdings, deductions, refund estimate, filing deadline
- **Retirement planner**: Dashboard tracks savings rate, target age, portfolio value, monthly contribution, projected balance
- **Budget tracker**: Dashboard tracks monthly spend, savings target, emergency fund progress, debt payoff date
- **Investor**: Dashboard tracks portfolio allocation, YTD return, dividend yield, rebalancing status
