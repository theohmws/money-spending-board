## 1. Extract `useTheme` and `useI18n`

- [x] 1.1 Create `src/hooks/useTheme.ts`: `theme`, `setTheme` (localStorage `msb_theme` read/persist), `themeTokens` — moved verbatim from `useSpendingBoard.ts`
- [x] 1.2 Create `src/hooks/useI18n.ts`: `lang`, `toggleLang` (localStorage `msb_lang` read/persist), `t` (`I18N[lang]`) — moved verbatim
- [x] 1.3 Add `src/hooks/useTheme.test.ts` and `src/hooks/useI18n.test.ts` using `renderHook` from `@testing-library/react`
- [x] 1.4 Wire both into `useSpendingBoard` in place of the extracted state; confirm returned `theme`/`setTheme`/`themeTokens`/`lang`/`toggleLang`/`t` are unchanged

## 2. Extract `useAuthSession`

- [x] 2.1 Create `src/hooks/useAuthSession.ts`: Supabase client construction/ref, `booting`, `session`, `configMissing`, `authMode`/`authForm`/`authError`/`authLoading`, `onAuthEmailChange`/`onAuthPasswordChange`/`toggleAuthMode`, `submitAuth`, `signOut`
- [x] 2.2 Expose an `onSessionResolved` callback/effect hook point so the composition root can react when a session becomes available (replacing the inline `loadUserData(...)` calls currently inside the auth effect)
- [x] 2.3 Expose the Supabase client (via ref or return value) for the composition root to pass to `useTransactions`
- [x] 2.4 Add `src/hooks/useAuthSession.test.ts` covering sign-in/sign-up/sign-out and config-missing detection (mock `@supabase/supabase-js`'s `createClient`)
- [x] 2.5 Wire into `useSpendingBoard`; confirm `booting`/`showConfigError`/`showLogin`/`showApp` and all auth-related returned fields are unchanged

## 3. Extract `useRatios`, `useProfile`, `useCategoryMeta`

- [x] 3.1 Create `src/hooks/useRatios.ts`: `ratios`, `showRatioModal`, `ratioForm`, `onRatioChange`, `ratioSum`, `saveRatios`, `openRatioModal`, `closeRatioModal`, and a `load(email)` function reading `msb_ratios_<email>`
- [x] 3.2 Create `src/hooks/useProfile.ts`: `profile`, `profileForm`, `showProfile`, `onProfileNameChange`, `onProfileIncomeChange`, `avatarSwatches` (wraps `selectAvatarColor` internally), `saveProfile`, `openProfile`, `closeProfile`, and a `load(email)` function reading `msb_profile_<email>` — `profileInitial` stays in the composition root since it needs the session email as a fallback (cross-domain)
- [x] 3.3 Create `src/hooks/useCategoryMeta.ts`: `categoryMeta`, `categoryMetaForm`, `showCategorySettings`, `selectCategoryIcon`, `selectCategoryPalette`, `saveCategoryMeta`, `openCategorySettings`, `closeCategorySettings`, and a `load(email)` function reading `msb_catmeta_<email>`
- [x] 3.4 Handle `editSplitFromProfile` and the profile-closing side of `openCategorySettings` as cross-hook actions at the composition root (each composes `useProfile` with `useRatios` or `useCategoryMeta`)
- [x] 3.5 Add colocated tests for all three: `useRatios.test.ts`, `useProfile.test.ts`, `useCategoryMeta.test.ts` (localStorage read/write, form state, save/close behavior)
- [x] 3.6 Wire all three into `useSpendingBoard`; confirm returned fields for ratio/profile/category-settings modals are unchanged

## 4. Extract `useTransactions`

- [x] 4.1 Create `src/hooks/useTransactions.ts`: `selectedMonth`, `onMonthChange`, `monthOptions`, `monthTx`, `income`/`expense`/`balance`, `showAddModal`, `txType`, `txForm`, `onTxAmountChange`/`onTxNoteChange`/`onTxDateChange`/`onTxCategoryChange`, `openAddModal`, `closeAddModal`, `saveTransaction`, `deleteTx`, and a `load(client)`/`clear()` pair — accepts the shared `SupabaseClient` ref as a parameter (per design decision 5), does not construct its own
- [x] 4.2 Add `src/hooks/useTransactions.test.ts` covering month filtering, income/expense aggregation, save/delete (mock the passed-in Supabase client)
- [x] 4.3 Wire into `useSpendingBoard`, via a composition-root-local client ref mirrored from `useAuthSession`'s resolved client (same hook-ordering reason `resolvedEmail` exists — `useTransactions` must be constructed before `useAuthSession` so its `load` can be referenced by `handleSessionResolved`); confirm returned transaction-related fields are unchanged

## 5. Rebuild the composition root

- [x] 5.1 Reduce `useSpendingBoard` to: call all seven domain hooks, wire the session-resolved → `load(...)` orchestration (transactions/ratios/profile/categoryMeta) via a single `handleSessionResolved` callback passed into `useAuthSession` (which invokes it from its own effect), keep `viewportWidth`/`isDesktop` (no natural domain owner) — composition root shrank from 703 to 397 lines, with only 4 `useState` calls left (all composition-root-owned plumbing/UI state, no domain state)
- [x] 5.2 Relocate the cross-slice derived `useMemo`s to the composition root, unchanged dependency arrays: `groupsLocalized`, `catById`, `budgetBase`, `categoryCards`, `transactionRows`, `categoryOptions`, `categorySettingsRows`, `ratioRows` — `avatarSwatches` ended up moved into `useProfile` instead (single-domain, no cross-slice dependency), see 3.2 note
- [x] 5.3 Diff the returned object's keys against the pre-refactor `useSpendingBoard` return statement to confirm nothing was dropped or renamed — verified via `diff` against the pre-refactor git HEAD version: all 65 return keys identical, same order

## 6. Verify

- [x] 6.1 `npm run check-types` — clean
- [x] 6.2 `npm run lint` — clean
- [x] 6.3 `npm run test` — 48/48 tests pass across 11 suites (includes the pre-existing `app/page.test.tsx` full-integration test: sign-in, dashboard render, add-transaction, lang toggle)
- [x] 6.4 Manual smoke via `/verify` skill — partial: no scripted browser driver was available in this environment (Playwright not installed, Chrome extension not connected), so a literal click-through wasn't run by the agent. Instead verified via the user's own already-running dev server (`.next/dev/logs/next-development.log`): Turbopack HMR recompiled cleanly on every edit across this change with zero compile/runtime errors. Recommend the user do a quick manual click-through (sign in, add transaction, edit ratios/categories/profile, toggle theme/lang) since they already have the app open.
