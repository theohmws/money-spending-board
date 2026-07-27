## 1. i18n

- [x] 1.1 Add tab-label strings to `I18nDict` in `src/utils/BoardConfig.ts` (both `th`/`en`): `overviewTab`, `graphTab`, `trendTab`, `compareTab`.

## 2. Tab state in `useSpendingBoard`

- [x] 2.1 Add `activeTab: 'overview' | 'graph'` state (default `'overview'`) and a setter/toggle.
- [x] 2.2 Add `activeGraphTab: 'trend' | 'compare'` state (default `'trend'`) and a setter/toggle.
- [x] 2.3 Return both plus their setters from `useSpendingBoard`.

## 3. Month-bucketing helpers

- [x] 3.1 Add a pure helper (in `src/utils/boardHelpers.ts`) for calendar-relative "previous month" arithmetic on a `YYYY-MM` string (parse, decrement, handle January→December-of-prior-year rollover, reformat) — reuse instead of duplicating the rollover logic already in `monthOptions` (`useTransactions.ts:64-68`).
- [x] 3.2 Unit test the previous-month helper directly, including the year-rollover case (e.g. `2026-01` → `2025-12`).

## 4. Trend data derivation

- [x] 4.1 In `useSpendingBoard.ts`, add a `monthlyTotals` `useMemo`: bucket the full `transactions` array (not `monthTx`) by `monthKey`, summing `income`/`expense` per month.
- [x] 4.2 Filter to months with at least one transaction; ensure `selectedMonth` is included even if absent (zero values).
- [x] 4.3 Sort ascending by month, cap to the 6 most recent; if `selectedMonth` falls outside that window, append it as an additional entry (per design.md Decision 3).
- [x] 4.4 Mark the `selectedMonth` entry so the chart component can visually emphasize it (e.g. an `isSelected` boolean per entry).

## 5. Compare data derivation

- [x] 5.1 In `useSpendingBoard.ts`, add a `previousMonthCategorySpend` `useMemo`: using the Task 3.1 helper, compute the previous-month key from `selectedMonth`, then sum expense amounts per `CategoryId` from the full `transactions` array filtered to that month key (mirrors `categoryCards`'s `spent` computation at `useSpendingBoard.ts:208-210`, parameterized by month instead of hardcoded to `monthTx`).
- [x] 5.2 Expose both `selectedMonth`'s per-category spend (already derivable from existing `categoryCards`) and `previousMonthCategorySpend` in a shape the Compare chart component can consume directly (e.g. `compareRows: { id: CategoryId; name: string; color: string; selectedSpend: number; previousSpend: number }[]`).

## 6. Chart components

- [x] 6.1 Build a shared presentational `GroupedBarChart` component (hand-rolled SVG, no new dependency) taking `{ groups: { label: string; bars: { value: number; color: string; emphasized?: boolean }[] }[] }`.
- [x] 6.2 Build `TrendChart` (`src/components/board/TrendChart.tsx`), mapping `monthlyTotals` into `GroupedBarChart`'s shape (income/expense pair per month).
- [x] 6.3 Build `CompareChart` (`src/components/board/CompareChart.tsx`), mapping `compareRows` into `GroupedBarChart`'s shape (selected/previous pair per category), using each category's `GROUPS` color.

## 7. Tab bar UI

- [x] 7.1 Build a tab-bar component (or inline segmented control matching the existing expense/income pill-toggle style from `AddTransactionModal.tsx`) for `Overview`/`Graph`.
- [x] 7.2 Build the nested `Trend`/`Compare` sub-tab control, same visual pattern, shown only when `Graph` is active.
- [x] 7.3 Wire both into `BoardCard.tsx`: render existing `BudgetSplit`+`TransactionList` under `Overview`; render the sub-tab control + `TrendChart`/`CompareChart` under `Graph`.

## 8. Tests

- [x] 8.1 Test `monthlyTotals` derivation: populated-months-only filtering, `selectedMonth` inclusion when empty, 6-month cap, out-of-window `selectedMonth` appended.
- [x] 8.2 Test `previousMonthCategorySpend` derivation: correct month-before-selected computation, zero values when previous month has no transactions, year-rollover case.
- [x] 8.3 Test tab state defaults and toggles (`activeTab` defaults to `overview`, `activeGraphTab` defaults to `trend`, switching works, no persistence across a fresh hook mount).

## 9. Verification

- [x] 9.1 `npm run check-types`, `npm run lint`, `npm run test` all clean.
- [x] 9.2 Manually verify in the browser (per the project's `verify` skill, using the local Supabase stack): switch Overview↔Graph↔Trend↔Compare, confirm selected-month bar emphasis in Trend, confirm Compare's previous-month bars are zero for a month with no data, confirm no second month selector appears anywhere in Compare.
