## Context

`src/hooks/useSpendingBoard.ts` is 703 lines and the single source of state/handlers for the whole board: Supabase session/auth, transactions (Supabase-backed), ratios/profile/category-meta (localStorage-backed), theme, i18n, viewport, and every modal's open/form state. Nothing in it is unit-tested today — testing any one piece (e.g. `saveRatios`) requires mounting the whole hook, including the Supabase client setup and session bootstrap.

Cross-cutting complication discovered while mapping the split: several of the hook's returned values are not owned by any single domain — they're joins across domains. `categoryCards` alone reads `categoryMeta` + `ratios` + `monthTx` (from transactions) + `budgetBase` (derived from `profile.monthlyIncome` OR transaction income) + `lang`/`theme` for display formatting. Same pattern for `transactionRows`, `categoryOptions`, `categorySettingsRows`, `ratioRows`. Additionally, session resolution (`getSession`/`onAuthStateChange`) currently triggers loads for transactions, ratios, profile, and category-meta directly inline — auth today "knows about" every other domain's loader.

`@testing-library/react` (already a dependency, v16.3.2) ships `renderHook`, and `jest-environment-jsdom` is already configured — no new test tooling needed.

## Goals / Non-Goals

**Goals:**
- Decompose `useSpendingBoard` into independently unit-testable domain-sliced hooks: `useAuthSession`, `useTheme`, `useI18n`, `useRatios`, `useProfile`, `useCategoryMeta`, `useTransactions`.
- Preserve `useSpendingBoard`'s returned object shape exactly — every key, every value, byte-for-byte equivalent behavior. `BoardCard.tsx` and all `src/components/board/*` consumers require zero changes.
- Add colocated tests for each new slice hook.

**Non-Goals:**
- No change to `BoardCard.tsx`'s prop-passing style (named props vs spread) — that's a separate, already-declined direction (loses the Interface-Segregation value of `Pick<ReturnType<...>>` component typing).
- No React Context, Zustand, Jotai, or Feature-Sliced Design layering — declined earlier as disproportionate ceremony for a single-screen app.
- No behavior, UI, or Supabase schema/query changes — this is a pure internal decomposition.
- No performance work (memoization tuning, render-count reduction) beyond preserving existing `useMemo`/`useCallback` dependency arrays as-is.

## Decisions

### 1. Keep a composition-root hook; don't fully distribute state to components
`useSpendingBoard` remains, shrunk to ~120-150 lines. It calls each domain hook, wires cross-slice orchestration, computes the derived joins, and returns the same merged object. Alternative considered: have `BoardCard` call all 7 hooks directly and pass results to children — rejected because the derived joins (`categoryCards` etc.) have no single owning slice; someone still has to compute them, and doing it in `BoardCard` would put business logic in a presentational component.

### 2. Slice boundaries follow state ownership, not UI grouping
Seven slices: `useAuthSession` (session, Supabase client, auth form/modes, sign-in/out), `useTheme`, `useI18n`, `useRatios`, `useProfile`, `useCategoryMeta`, `useTransactions`. Each owns its own `useState`/`useCallback`s and (where applicable) its own `load(...)` function. This mirrors the actual independent variables in the current hook (verified by reading `useSpendingBoard.ts` fully) rather than guessing a shape.

### 3. Cross-slice derived views live in the composition root, not in any slice
`categoryCards`, `transactionRows`, `categoryOptions`, `categorySettingsRows`, `ratioRows` are computed in `useSpendingBoard` from multiple slices' outputs, with the same `useMemo` dependency arrays as today (just relocated, not redesigned). Alternative considered: attach `categoryCards` to `useTransactions` since it needs `monthTx` — rejected, since it equally needs `categoryMeta`, `ratios`, and `profile`; that would force `useTransactions` to accept three other slices as parameters, inverting ownership for no benefit.

### 4. Composition root owns load orchestration; slices expose loaders, don't self-subscribe
Each of `useRatios`/`useProfile`/`useCategoryMeta`/`useTransactions` exposes a `load(client, email)`-shaped function. `useAuthSession` only manages session/client state — it does not call other slices' loaders itself. The composition root's effect (session resolved → call each slice's loader) replaces today's inline calls inside the auth effect. Alternative considered: each slice independently calls `useAuthSession()` internally and reacts to session changes on its own — rejected, this creates redundant session-subscription effects and no guarantee of load ordering/atomicity that a single effect gives for free (verified: load functions don't share state across each other, so order between them doesn't matter, but *whether* they all fire together on session change does).

### 5. Supabase client stays singly-owned by `useAuthSession`
Other slices that need it (`useTransactions`, for `loadTransactions`/`saveTransaction`/`deleteTx`) receive the client as a parameter from the composition root rather than creating/holding their own reference — avoids multiple `SupabaseClient` instances.

## Risks / Trade-offs

- **[Risk]** Extraction subtly changes effect timing or `useCallback`/`useMemo` dependency arrays, causing a behavior regression despite the "no API change" intent → **Mitigation**: extract one slice at a time (not a big-bang rewrite), run `npm run check-types` + `npm run test` + manual smoke (per `/verify` skill) after each extraction, and diff the composition root's returned object keys against the original before/after.
- **[Risk]** Derived-view `useMemo` dependency arrays are easy to get subtly wrong when relocated (e.g. dropping a dependency that only mattered because it lived in the same closure before) → **Mitigation**: keep dependency arrays textually identical to the current hook, just re-pointed at the new slice variables; treat any deviation as a deliberate, called-out decision, not an incidental cleanup.
- **[Risk]** No prior pattern in this repo for testing hooks (`src/hooks/` has zero existing tests) → **Mitigation**: confirmed `@testing-library/react` v16.3.2 (has `renderHook`) and `jest-environment-jsdom` are already installed and configured; no new tooling needed, first slice's test establishes the pattern for the rest.

## Migration Plan

1. Extract lowest-risk, most self-contained slices first: `useTheme`, `useI18n` (pure state + localStorage persistence, no Supabase, no cross-slice reads).
2. Extract `useAuthSession` (owns Supabase client + session) — needed before slices that depend on the client.
3. Extract `useRatios`, `useProfile`, `useCategoryMeta` (each a self-contained localStorage-backed CRUD domain with a modal).
4. Extract `useTransactions` (most complex: Supabase queries, income/expense aggregation).
5. Rebuild `useSpendingBoard` as the composition root: wire load orchestration, relocate the derived-view `useMemo`s, confirm the returned object is identical to the pre-refactor shape.
6. Add each slice's test alongside its extraction step (not deferred to the end).
7. Final pass: `npm run lint`, `npm run check-types`, `npm run test`, manual smoke via the `/verify` skill.

No production rollback concerns — pure client-side refactor, no data migration, no deployed-state changes. Revertible per-commit via git if a step regresses behavior.

## Open Questions

- Keep the name `useSpendingBoard` for the composition root (no consumer-facing reason to rename) — leaning yes, open to revisiting if it reads confusingly once split.
