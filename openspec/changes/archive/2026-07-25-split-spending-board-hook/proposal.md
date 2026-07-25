## Why

`useSpendingBoard` (`src/hooks/useSpendingBoard.ts`, 703 lines) owns every piece of board state — auth, transactions, ratios, profile, category metadata, theme, i18n, and every modal's form state — in one function. It has zero test coverage, and every state slice is coupled to every other slice through one shared closure, so there's no way to test, say, ratio-saving logic without standing up the whole hook (Supabase client, session, ~15 other `useState`s included). Prop counts on consumers (`ProfileModal` alone takes 16 props from `BoardCard.tsx`) are a symptom of this — the underlying cause is one hook doing the job of seven.

## What Changes

- Split `useSpendingBoard` into domain-sliced hooks, one per bounded state domain: `useAuthSession`, `useTheme`, `useI18n`, `useRatios`, `useProfile`, `useCategoryMeta`, `useTransactions`.
- Keep `useSpendingBoard` as a thin composition root: it calls each slice hook, wires the "session resolved → each slice loads its user-scoped data" orchestration (today done inline inside the auth effect), computes the cross-slice derived views (`categoryCards`, `transactionRows`, `categoryOptions`, `categorySettingsRows`, `ratioRows` — each blends 2+ slices), and returns the exact same merged shape it does today.
- **No behavior change and no public API change**: `BoardCard.tsx` and all `src/components/board/*` consumers keep importing `useSpendingBoard` and reading the same fields — this is an internal decomposition, not a feature or UI change.
- Add colocated unit tests for each new slice hook (currently impossible against the monolith without mocking unrelated domains).

## Capabilities

### New Capabilities
- `spending-board-state`: the composition architecture for the board's client state — one composition-root hook (`useSpendingBoard`) assembling independently testable domain-sliced hooks, with defined ownership boundaries and cross-slice derived-view responsibilities.

### Modified Capabilities
(none — no existing spec covers board state; `site-metadata` is unrelated)

## Impact

- `src/hooks/useSpendingBoard.ts`: shrinks from ~703 lines to a composition root (~120-150 lines); all `useState`/`useCallback` ownership moves out.
- New files: `src/hooks/useAuthSession.ts`, `src/hooks/useTheme.ts`, `src/hooks/useI18n.ts`, `src/hooks/useRatios.ts`, `src/hooks/useProfile.ts`, `src/hooks/useCategoryMeta.ts`, `src/hooks/useTransactions.ts` (+ colocated `*.test.ts` for each).
- `src/components/board/*`: no changes expected — they consume `useSpendingBoard`'s return shape, which stays identical.
- No Supabase schema, API, or UI/styling changes.
