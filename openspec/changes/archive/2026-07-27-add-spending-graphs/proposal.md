## Why

Today the board only shows numbers — category cards with a percent and a peso amount, and a flat transaction list. There's no way to see spending shape at a glance: how this month compares to others, or how the needs/wants/savings mix shifted month over month. A visual view answers questions the current numeric-only UI can't without manual month-by-month comparison in your head.

## What Changes

- New top-level tab bar on the board: **Overview** (today's existing cards + transaction list, unchanged) and **Graph** (new).
- The **Graph** tab has its own two sub-tabs: **Trend** and **Compare**.
  - **Trend**: a bar chart of income vs. expense, one pair of bars per month, across months that have at least one transaction (plus `selectedMonth` itself even if empty, so the highlighted bar always exists). The bar(s) for `selectedMonth` are visually emphasized. No new month-selection UI — it rides the existing header month picker.
  - **Compare**: a grouped bar chart of the three category groups (needs/wants/savings), each with two bars — `selectedMonth`'s spend vs. the immediately preceding month's spend. No second month selector — "previous month" is always relative to whatever's selected in the existing picker.
- Charts are hand-rolled SVG (no new npm dependency) themed via the existing `themeTokens`/`PALETTE` system, not a charting library.
- Tab selection (`Overview`/`Graph`, and `Trend`/`Compare` within Graph) is transient UI state — not persisted across reloads, unlike `theme`/`lang`.

## Capabilities

### New Capabilities
- `spending-graphs`: covers the tab structure (Overview/Graph, Trend/Compare), the Trend chart's month-selection/highlighting behavior, and the Compare chart's previous-month derivation.

### Modified Capabilities
(none — this is new UI surface; no existing requirement in `spending-board-state` or elsewhere changes. The composition-root pattern that spec already governs is followed, not altered: new tab state joins the existing view-level `useState` fields like `showRuleInfo`, not a new domain hook.)

## Impact

- `src/components/board/BoardCard.tsx`: render the new tab bar and switch between Overview/Graph content.
- New components: a tab-bar component (or inline segmented control, TBD in design), a `TrendChart` component, a `CompareChart` component.
- `src/hooks/useSpendingBoard.ts`: new `activeTab`/`activeGraphTab` state and toggles; new derived data for Trend (per-month income/expense aggregation) and Compare (previous-month category spend), computed alongside the existing `categoryCards`/`transactionRows` cross-slice derivations.
- `src/utils/BoardConfig.ts`: new i18n strings for tab labels ("Overview"/"Graph", "Trend"/"Compare").
- No backend/schema change — all data (`transactions`, loaded in full by `useTransactions`) already exists client-side.
- No new npm dependency.
