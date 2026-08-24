## 1. Schema

- [x] 1.1 Migration: `alter table spending_board.board_settings add column profile jsonb, add column ratios jsonb, add column category_meta jsonb;` — nullable, no default (see design.md Decision 2). File: `supabase/migrations/20260824090000_board_settings_profile_ratios_categorymeta.sql`.
- [x] 1.2 Applied via the Supabase MCP tools to the `money-spending-board` project (`yjphlaymjjmbinhmdcqj`). Verified after applying: the existing `board_settings` row shows `NULL` for `profile`/`ratios`/`category_meta`; `get_advisors` shows no new security findings (only the pre-existing, unrelated leaked-password-protection warning).

## 2. Shared migration helper

- [x] 2.1 Small shared helper (e.g. `src/utils/boardHelpers.ts` or a new `src/hooks/useSupabaseSettingsField.ts`-style utility) implementing the "column non-null → use it; column null → read localStorage, fall back to default, upsert, use that" branch from design.md Decision 3, parameterized by column name, `localStorage` key, and default value — so `useProfile`/`useRatios`/`useCategoryMeta` share one implementation of the migration branch rather than three copies of the same logic with different field names.

## 3. `useProfile`

- [x] 3.1 Reshape signature to `(clientRef, userId, email, t)`, matching `useBoardSettings`'s pattern (design.md Decision 4).
- [x] 3.2 `load(client, email)`: apply the Task 2.1 helper for the `profile` column / `msb_profile_<email>` key / `DEFAULT_PROFILE`.
- [x] 3.3 `saveProfile` becomes `async`, upserts `board_settings.profile`, gains `profileSaveError` state (mirrors `useBoardSettings.settingsError`).
- [x] 3.4 Add `clear()` resetting to `DEFAULT_PROFILE`, for `signOut`.

## 4. `useRatios`

- [x] 4.1 Reshape signature to `(clientRef, userId, email, t)`.
- [x] 4.2 `load(client, email)`: apply the Task 2.1 helper for the `ratios` column / `msb_ratios_<email>` key / `DEFAULT_RATIOS`.
- [x] 4.3 `saveRatios` becomes `async`, upserts `board_settings.ratios`, gains `ratiosSaveError` state. Existing `ratioSum !== 100` guard stays a client-side check before the upsert.
- [x] 4.4 Add `clear()` resetting to `DEFAULT_RATIOS`.

## 5. `useCategoryMeta`

- [x] 5.1 Reshape signature to `(clientRef, userId, email, t)`.
- [x] 5.2 `load(client, email)`: apply the Task 2.1 helper for the `category_meta` column / `msb_catmeta_<email>` key / `DEFAULT_CATEGORY_META`.
- [x] 5.3 `saveCategoryMeta` becomes `async`, upserts `board_settings.category_meta`, gains `categoryMetaSaveError` state.
- [x] 5.4 Add `clear()` resetting to `DEFAULT_CATEGORY_META`.

## 6. Composition root

- [x] 6.1 `useSpendingBoard.ts`: pass `clientRefLocal`/`resolvedUserId`/`t` into `useRatios`/`useProfile`/`useCategoryMeta` (alongside the existing `resolvedEmail`), matching how `useBoardSettings`/`useImportCategoryRules` are already wired.
- [x] 6.2 `handleSessionResolved`: change the three `load(currentEmail)` calls to `load(client, currentEmail)`.
- [x] 6.3 `signOut`: add the three new `clear()` calls alongside the existing `txSlice.clear()`/`importRulesSlice.clear()`/`boardSettingsSlice.clear()`.
- [x] 6.4 Thread `profileSaveError`/`ratiosSaveError`/`categoryMetaSaveError` through the returned object for the modals to read.

## 7. Modals

- [x] 7.1 `ProfileModal.tsx`: surface `profileSaveError` (same treatment as `badgeColorsError` in `ImportSettingsModal`).
- [x] 7.2 `RatioModal.tsx`: surface `ratiosSaveError`.
- [x] 7.3 `CategorySettingsModal.tsx`: surface `categoryMetaSaveError`.

## 8. Tests

- [x] 8.1 Update `useProfile.test.ts`, `useRatios.test.ts`, `useCategoryMeta.test.ts` for the new signature: mocked Supabase client (following `useBoardSettings.test.ts`'s existing pattern), covering (a) column already non-null → used as-is, no `localStorage` read; (b) column null + matching `localStorage` key present → migrated value used and upserted; (c) column null + no `localStorage` key → `DEFAULT_*` used and upserted; (d) save success updates local state and clears any prior error; (e) save failure sets the new error state and does not close the modal/reset the form.
- [x] 8.2 Updated `useSpendingBoard.test.ts`'s `board_settings` mock to include `upsert` (now called by the ratios/profile/categoryMeta migration path on every mount, not just `saveBadgeColors`). No assertions there target these three slices' internals directly, so no further changes were needed.

## 9. Verification

- [x] 9.1 `npm run check-types`, `npm run lint`, `npm run test` all clean (148 tests passing). Fixed one incidental regression surfaced along the way: `app/page.test.tsx`'s shared Supabase mock predated `board_settings` and had no `board_settings`-shaped branch (`.select().maybeSingle()`/`.upsert()`) — `useBoardSettings.load`'s pre-existing throw against it was a synchronous throw silently swallowed by `submitAuth`'s try/catch, but my new hooks' `async` `loadBoardSettingField` turns the same gap into a real unhandled rejection. Fixed by giving that mock a `board_settings` branch, mirroring `useSpendingBoard.test.ts`'s existing one.
- [x] 9.2 `npm run build-prod` clean (static export unaffected).
- [ ] 9.3 **Blocked, not a skipped step.** Attempted for real this session: started `npm run dev` locally, pointed it at the live Supabase project via `.env.local`, and drove it with Playwright (Chromium is pre-installed in this environment) — seeded legacy `localStorage` values for a fresh test email, then tried to sign up. Sign-up failed with "Failed to fetch." Root cause confirmed via the sandbox's outbound-proxy status endpoint (`$HTTPS_PROXY/__agentproxy/status`): direct HTTPS from this container to `*.supabase.co` (and `mcp.supabase.com`) is explicitly policy-denied (`403`, "policy denial", logged in `recentRelayFailures`) — only the dedicated Supabase MCP server tool has a path to the project, and that path can't drive a browser session. This isn't a missing-browser problem, it's a missing-network-path-to-Supabase-from-a-browser problem, and isn't fixable from inside this session. Cleaned up the local `.env.local`/dev server afterward. Needs a real environment (or an environment whose egress policy allows the Supabase project's own domain) to complete — see the `verify` skill.
