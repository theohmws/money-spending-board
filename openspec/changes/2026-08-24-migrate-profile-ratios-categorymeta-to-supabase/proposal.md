## Why

`useProfile`, `useRatios`, and `useCategoryMeta` are the last three domains of board state still living in `localStorage`, namespaced per signed-in email (`msb_profile_<email>`, `msb_ratios_<email>`, `msb_catmeta_<email>`). That means a user's name, avatar color, monthly income, 50/30/20 split, and per-category icon/color are all per-browser: switching devices or clearing site data silently resets them to defaults. `transactions` moved to Supabase long ago, and `board_settings` (added for the KTC import's badge colors) already proved out a DB-backed shape for exactly this kind of small, per-user JSON settings blob — explicitly flagged at the time as a precedent for this deferred migration. This change closes that gap for the three remaining domains.

## What Changes

- `spending_board.board_settings` gains three new nullable `jsonb` columns: `profile`, `ratios`, `category_meta`. No new table — same one-row-per-user shape `badge_colors` already uses.
- `useProfile`, `useRatios`, `useCategoryMeta` are reshaped to match `useBoardSettings`'s existing pattern: they take a Supabase client ref + `userId` (not just `email`), `load` becomes a Supabase `select`, and `save*` becomes an async `upsert` with its own error state, mirroring `useBoardSettings.saveBadgeColors`/`settingsError` exactly.
- **One-time auto-migration per user, per field, on first load after this ships**: if a `board_settings` column is still `null` for the signed-in user, the corresponding `localStorage` value (if any) is read once and upserted into that column; from then on the column is the sole source of truth and the migration path never runs again for that user. A brand-new user with no `localStorage` value gets the existing `DEFAULT_PROFILE`/`DEFAULT_RATIOS`/`DEFAULT_CATEGORY_META` written in instead. Leftover `localStorage` data after migration is inert and not explicitly cleaned up.
- `ProfileModal`, `RatioModal`, `CategorySettingsModal` gain a save-error surface (their saves are now network calls, not synchronous), following the same treatment `board_settings`-backed UI already has.

## Capabilities

### Modified Capabilities
- `spending-board-state`: the composition-root rules already describe `ratios`/`profile`/`category metadata` as user-scoped, session-loaded domains — this change is about how they persist (Supabase instead of `localStorage`), which changes two existing requirements' scenarios (the shared-client requirement widens beyond just transactions; the "independently testable without a Supabase client" scenario for ratios no longer holds verbatim, since the hook now takes a client) and adds a new requirement for the first-load migration behavior itself.

## Impact

- New migration (`supabase/migrations/`): `alter table spending_board.board_settings add column profile jsonb, add column ratios jsonb, add column category_meta jsonb;` — additive, nullable, no default (so `NULL` unambiguously means "not yet migrated for this user," distinct from a populated default value).
- `src/hooks/useProfile.ts`, `useRatios.ts`, `useCategoryMeta.ts`: reshaped to the `useBoardSettings.ts` pattern (client ref + `userId` instead of `email` alone; `load(client, email)`; async `save*` with error state; new `clear()` for sign-out). `email` is still threaded through for the one-time `localStorage` read during migration.
- `src/hooks/useSpendingBoard.ts`: `handleSessionResolved` calls the three slices' `load(client, resolvedEmail)`; `signOut` calls their new `clear()`.
- `src/components/board/ProfileModal.tsx`, `RatioModal.tsx`, `CategorySettingsModal.tsx`: surface the new save-error state; saves are no longer instant/synchronous.
- Existing hook tests (`useProfile.test.ts`, `useRatios.test.ts`, `useCategoryMeta.test.ts`) need updating for the new signature and a mocked Supabase client, following `useBoardSettings.test.ts`'s existing pattern.
- No change to `transactions`, `import_category_rules`, or the badge-color settings already on `board_settings` — this only adds columns and touches the three domains named above.
