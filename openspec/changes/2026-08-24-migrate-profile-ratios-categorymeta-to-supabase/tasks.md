## 1. Schema

- [ ] 1.1 Migration: `alter table spending_board.board_settings add column profile jsonb, add column ratios jsonb, add column category_meta jsonb;` — nullable, no default (see design.md Decision 2).
- [ ] 1.2 Apply via the Supabase MCP tools or CLI to the `money-spending-board` project. Verify after applying: existing `board_settings` rows (if any) show `NULL` for all three new columns; `get_advisors` shows no new security findings.

## 2. Shared migration helper

- [ ] 2.1 Small shared helper (e.g. `src/utils/boardHelpers.ts` or a new `src/hooks/useSupabaseSettingsField.ts`-style utility) implementing the "column non-null → use it; column null → read localStorage, fall back to default, upsert, use that" branch from design.md Decision 3, parameterized by column name, `localStorage` key, and default value — so `useProfile`/`useRatios`/`useCategoryMeta` share one implementation of the migration branch rather than three copies of the same logic with different field names.

## 3. `useProfile`

- [ ] 3.1 Reshape signature to `(clientRef, userId, email, t)`, matching `useBoardSettings`'s pattern (design.md Decision 4).
- [ ] 3.2 `load(client, email)`: apply the Task 2.1 helper for the `profile` column / `msb_profile_<email>` key / `DEFAULT_PROFILE`.
- [ ] 3.3 `saveProfile` becomes `async`, upserts `board_settings.profile`, gains `profileSaveError` state (mirrors `useBoardSettings.settingsError`).
- [ ] 3.4 Add `clear()` resetting to `DEFAULT_PROFILE`, for `signOut`.

## 4. `useRatios`

- [ ] 4.1 Reshape signature to `(clientRef, userId, email, t)`.
- [ ] 4.2 `load(client, email)`: apply the Task 2.1 helper for the `ratios` column / `msb_ratios_<email>` key / `DEFAULT_RATIOS`.
- [ ] 4.3 `saveRatios` becomes `async`, upserts `board_settings.ratios`, gains `ratiosSaveError` state. Existing `ratioSum !== 100` guard stays a client-side check before the upsert.
- [ ] 4.4 Add `clear()` resetting to `DEFAULT_RATIOS`.

## 5. `useCategoryMeta`

- [ ] 5.1 Reshape signature to `(clientRef, userId, email, t)`.
- [ ] 5.2 `load(client, email)`: apply the Task 2.1 helper for the `category_meta` column / `msb_catmeta_<email>` key / `DEFAULT_CATEGORY_META`.
- [ ] 5.3 `saveCategoryMeta` becomes `async`, upserts `board_settings.category_meta`, gains `categoryMetaSaveError` state.
- [ ] 5.4 Add `clear()` resetting to `DEFAULT_CATEGORY_META`.

## 6. Composition root

- [ ] 6.1 `useSpendingBoard.ts`: pass `clientRefLocal`/`resolvedUserId`/`t` into `useRatios`/`useProfile`/`useCategoryMeta` (alongside the existing `resolvedEmail`), matching how `useBoardSettings`/`useImportCategoryRules` are already wired.
- [ ] 6.2 `handleSessionResolved`: change the three `load(currentEmail)` calls to `load(client, currentEmail)`.
- [ ] 6.3 `signOut`: add the three new `clear()` calls alongside the existing `txSlice.clear()`/`importRulesSlice.clear()`/`boardSettingsSlice.clear()`.
- [ ] 6.4 Thread `profileSaveError`/`ratiosSaveError`/`categoryMetaSaveError` through the returned object for the modals to read.

## 7. Modals

- [ ] 7.1 `ProfileModal.tsx`: surface `profileSaveError` (same treatment as `badgeColorsError` in `ImportSettingsModal`).
- [ ] 7.2 `RatioModal.tsx`: surface `ratiosSaveError`.
- [ ] 7.3 `CategorySettingsModal.tsx`: surface `categoryMetaSaveError`.

## 8. Tests

- [ ] 8.1 Update `useProfile.test.ts`, `useRatios.test.ts`, `useCategoryMeta.test.ts` for the new signature: mocked Supabase client (following `useBoardSettings.test.ts`'s existing pattern), covering (a) column already non-null → used as-is, no `localStorage` read; (b) column null + matching `localStorage` key present → migrated value used and upserted; (c) column null + no `localStorage` key → `DEFAULT_*` used and upserted; (d) save success updates local state and clears any prior error; (e) save failure sets the new error state and does not close the modal/reset the form.
- [ ] 8.2 Update `useSpendingBoard.test.ts` for the new `load`/`clear` call signatures on these three slices, and the new save-error fields being threaded through.

## 9. Verification

- [ ] 9.1 `npm run check-types`, `npm run lint`, `npm run test` all clean.
- [ ] 9.2 `npm run build` clean (static export unaffected).
- [ ] 9.3 Manual verification once a real environment/browser is available (see the `verify` skill): sign in as a user with pre-existing `localStorage` profile/ratios/categoryMeta data on this branch, confirm it appears correctly after the migration fires, then reload and confirm no further `localStorage` reads occur (e.g. edit `localStorage` directly and confirm the UI still shows the DB-migrated value, not the edited one).
