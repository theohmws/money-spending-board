## Context

`BoardCard.tsx` currently renders `BudgetSplit` (three category cards) and `TransactionList` (flat row list) unconditionally, one after the other, inside a single scrollable region — no tabs, no view-switching, anywhere in the app. `useSpendingBoard.ts` is the composition root (per `spending-board-state`'s existing requirements): domain hooks (`useTransactions`, `useRatios`, `useCategoryMeta`, `useProfile`) stay independently testable, and cross-slice derived views (`categoryCards`, `transactionRows`, `categoryOptions`) are computed once, in the root, per that spec's "Cross-slice derived views are computed exactly once" requirement.

Relevant existing data, already loaded, zero new fetches needed:
- `useTransactions.ts`'s `load` fetches the user's *entire* transaction history in one query (not scoped to a month) — `monthTx` (`useTransactions.ts:56-59`) is a client-side filter over the full `transactions` array. Both Trend (needs all months) and Compare (needs two specific months) can read the same already-loaded `transactions` array.
- `useSpendingBoard.ts`'s `categoryCards` (`:202-228`) already computes, per category group, `spent` (sum of this-month expenses for that category) using `monthTx`. Compare needs the same computation parameterized by an arbitrary month, not just `selectedMonth`.
- `monthOptions` (`useTransactions.ts:61-81`) already builds the set of "months with data" unioned with a rolling 12-month window and `selectedMonth`. Trend's month axis is a subset of this same logic (months with data only, not the full rolling window — see Decision 3).
- `GROUPS` (`BoardConfig.ts:36-40`) gives the three category ids in a fixed order (`needs`, `savings`, `wants`) with `color`/`dark` per group — the same palette both existing `BudgetSplit` cards and the new Compare chart's bars should use, so a "needs" bar is always the same pink (`#F2AFC2`/`#7A2E42`) everywhere on the board.

## Goals / Non-Goals

**Goals:**
- Add a tab bar (`Overview` / `Graph`) to `BoardCard`, with `Graph` containing its own sub-tabs (`Trend` / `Compare`).
- Trend: income-vs-expense bars per month (months with data, `selectedMonth` always included), `selectedMonth`'s bar(s) visually emphasized.
- Compare: grouped bars per category group, `selectedMonth` vs. the month immediately before it.
- Reuse existing color tokens (`themeTokens`, `GROUPS[].color`) so the charts look native to the board, not bolted on.
- Zero new npm dependencies — hand-rolled SVG.

**Non-Goals:**
- No second month-selector for Compare (always "previous calendar month," per explore-mode decision).
- No persistence of tab selection across reloads (unlike `theme`/`lang` — this is disposable view state).
- No new chart types beyond bar charts (no donut, no line/area) — both Trend and Compare are bar-based by decision, one visual language for both.
- No backend/schema change.

## Decisions

**1. Tabs are plain `useState` in `useSpendingBoard.ts`, not a new domain hook.**
`showRuleInfo` already establishes the pattern for transient view-only UI state living directly in the composition root rather than a dedicated slice. Tab selection has the same shape (ephemeral, no persistence, no cross-domain derivation dependency) — `activeTab: 'overview' | 'graph'` and `activeGraphTab: 'trend' | 'compare'`, both plain `useState`, both returned from `useSpendingBoard` alongside existing view state.
Alternative considered: a `useGraphView` hook. Rejected — there's no domain logic here to isolate (no Supabase calls, no validation), just two enum-shaped `useState`s and two setters; a dedicated hook would be a hook for the sake of having one.

**2. Trend and Compare's aggregations are new `useMemo`s in `useSpendingBoard.ts`, alongside `categoryCards`.**
Both need to bucket the full `transactions` array by month — logic that doesn't belong in `useTransactions` (which owns CRUD + the current-month view, per `spending-board-state`'s domain-hook boundaries) and doesn't belong in a new domain hook (it's a derived *view* over transaction data, not a new independent domain — matches the spec's "cross-slice derived views are computed in the composition root" principle, even though this only touches one underlying domain (transactions), because it's a display-shaping computation, not domain state).
Concretely:
- `monthlyTotals: { month: string; income: number; expense: number }[]` — one entry per month with ≥1 transaction, plus `selectedMonth` if not already present (with zero income/expense), sorted ascending, capped to the most recent 6 entries (see Decision 3 for the cap).
- `previousMonthCategorySpend: Record<CategoryId, number>` — same `spent` computation as `categoryCards` does for `monthTx`, but filtered to the month key immediately before `selectedMonth` (string month arithmetic: parse `YYYY-MM`, decrement, reformat — no `Date`-object month-rollover edge cases beyond what `monthOptions` already handles the same way at `useTransactions.ts:64-68`).

**3. Trend caps at the 6 most recent populated months, not "all months with data."**
An account with years of history would otherwise render an ever-widening bar chart. 6 months fits comfortably in the ~430px mobile-card width this board is designed around (matches `BoardCard.tsx`'s fixed `430px` non-desktop width) without horizontal scrolling. If `selectedMonth` falls outside the most-recent-6 window (user picked an old month), it's added as a 7th bar rather than silently omitted — the whole point of "highlight the selected month" breaks if the selected month can vanish from its own chart.
Alternative considered: horizontal-scrollable full history. Rejected as unnecessary complexity for a first version; revisit if users have a specific need to see further back.

**4. Compare's "previous month" is calendar-relative, computed from `selectedMonth`, not from "the previous entry in `monthOptions`."**
`monthOptions` includes months with zero transactions (it's a picker, meant to show all selectable months). If Compare instead walked back through `monthOptions`'s array, "previous" could skip an empty month and silently compare against a month two calendar-months back. Calendar-relative arithmetic (`selectedMonth`'s month number minus 1) always compares against the literal preceding month, showing ฿0 bars if that month had no transactions — an honest "nothing happened last month" rather than a silently-wrong comparison.

**5. One shared bar-chart rendering approach for both Trend and Compare, parameterized by data shape.**
Both are grouped/paired bar charts (Trend: income+expense pair per month; Compare: 2 bars per category group). A single presentational component (e.g. `GroupedBarChart`) taking `{ groups: { label: string; bars: { value: number; color: string; emphasized?: boolean }[] }[] }` covers both, rather than two bespoke SVG layouts. Keeps the SVG math (scale, bar width, spacing) written once.

## Risks / Trade-offs

- **[Risk] Hand-rolled SVG bar chart needs its own scale/axis math (no library to lean on)** — this is real but bounded: a bar chart's scale is one `Math.max` over values and a linear map to pixel height, nothing like the complexity of arcs/curves a donut or line chart would need. → **Mitigation**: scope explicitly excludes donut/line (Non-Goals), keeping the SVG surface small enough to hand-write and unit-test.
- **[Trade-off] Capping Trend at 6 months (Decision 3) hides longer-term history.** → Acceptable for v1; the existing month-picker already lets a user manually select any historical month to see it as Overview/Compare's reference point, so long-range Trend isn't the only way to reach old data.
- **[Trade-off] No second month-selector for Compare means "vs. 3 months ago" isn't reachable.** → Matches the explicit product decision made during exploration; documented here so it's a known, deliberate gap, not an oversight if requested later.

## Migration Plan

Frontend-only, purely additive (new tabs, new derived `useMemo`s, no changes to existing returned fields of `useSpendingBoard`). No feature flag needed — ships as a normal PR. No data migration; no rollback beyond a normal revert.

## Open Questions

None blocking — all decisions above resolve the forks raised during exploration (tab nesting, trend window, compare's month source). Revisit the 6-month cap (Decision 3) if real usage shows it's too short.
