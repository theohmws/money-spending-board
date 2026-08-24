## Context

The board's user-scoped config today splits along one line: `transactions` (and, since the KTC import change, `import_category_rules` and `board_settings`) are Supabase-backed; `ratios`, `profile`, `categoryMeta` are `localStorage`-backed, namespaced per signed-in email (`msb_ratios_<email>`, `msb_profile_<email>`, `msb_catmeta_<email>`). This was a deliberate, explicitly-deferred gap (see `openspec/changes/2026-08-23-import-ktc-credit-card-statement/design.md` Decision 5c and its Non-Goals), not an oversight — `board_settings.badge_colors` was built specifically as "a shape precedent for the *separately deferred* `ratios`/`profile`/`categoryMeta` → Supabase migration ... those are the same 'small JSON blob' shape today and would map onto `jsonb` columns the same way." This change is that deferred migration.

All three domains are already small, whole-object-replace JSON blobs (`Profile`, `RatioMap`, `CategoryMetaMap` in `src/utils/BoardConfig.ts`) — none need their own relational table.

There is real user data in `localStorage` today (this repo's existing migrations are consistently careful about not discarding real rows — see the `spending_board` schema-move migration's comment), so the transition needs a path that doesn't silently reset every existing user back to defaults on their next login.

## Goals / Non-Goals

**Goals:**
- `profile`, `ratios`, `categoryMeta` persist to Supabase, syncing across devices/browsers for a signed-in user, same as `transactions`/`import_category_rules`/`board_settings` already do.
- Existing `localStorage` data survives the transition via a one-time, automatic, per-field migration on first load — no manual export/import step, no user-facing "migrate now" action.
- Match the existing `board_settings`/`useBoardSettings` shape and idiom exactly, so this isn't a second competing pattern for "small per-user JSON settings."

**Non-Goals:**
- No new tables. All three fold into `board_settings` as new columns, not `profile`/`ratios`/`category_meta` tables of their own — mirrors `badge_colors`'s existing shape rather than fragmenting into more one-row-per-user tables.
- No explicit `localStorage` cleanup after migration. Once a `board_settings` column is non-null it's the sole source read from; the stale `localStorage` key is simply never read again. Deleting it isn't necessary for correctness and isn't worth the extra code path here.
- No cross-field migration transaction (i.e. migrating `profile`, `ratios`, `category_meta` doesn't need to happen atomically as one all-or-nothing operation). Each field migrates independently, keyed by its own column being `null`.
- No change to `board_settings`'s existing `badge_colors` column, its RLS policies, or its grants — those are already correct for this table shape and apply unchanged to the three new columns.

## Decisions

**1. Extend `board_settings` with three new columns, rather than three new tables.**
`board_settings` already exists as exactly this shape: one row per user (`user_id uuid primary key`), RLS scoped by `(select auth.uid()) = user_id`, grants already in place for `authenticated`/`service_role`. Adding `profile jsonb`, `ratios jsonb`, `category_meta jsonb` to it needs one small `alter table` and reuses all the existing RLS/grant machinery — a new table per domain would triple the migration surface (three more RLS policy sets, three more grant statements) for data that's exactly as small and single-blob-shaped as `badge_colors` already is.
Alternative considered: one combined table (`profile`, `ratios`, `category_meta`, `badge_colors` all as separate tables). Rejected for the reason above — no relational structure needs three separate tables when a single upsert-by-`user_id` row already covers it.

**2. New columns are nullable with no default — `NULL` is the explicit "not yet migrated" signal.**
This is the load-bearing decision for the whole migration strategy. If the columns had defaults (e.g. `profile jsonb not null default '{"name":"", ...}'::jsonb`, mirroring how `badge_colors` itself has a populated default), a user who already has a `board_settings` row for an unrelated reason (e.g. they'd already set badge colors during the KTC import feature) would look "already migrated" the instant the columns are added — and their real `localStorage` profile/ratios/categoryMeta would never get copied in, silently discarded on next load. Keeping the columns `NULL` with no default keeps "has this user's data been migrated yet" unambiguous and independent of whether they happen to already have a `board_settings` row for some other field.

**3. Migration is per-field, per-user, lazy, and idempotent-by-construction — not a batch backfill migration.**
On `load(client, email)` for each of the three hooks:
```
column value from board_settings
  ├─ non-null  → use as-is (DB is already source of truth; covers every
  │              login after the first, and any other device/browser
  │              once migrated)
  └─ null      → read localStorage[`msb_<domain>_<email>`]
                   ├─ found   → value = that JSON
                   └─ missing → value = DEFAULT_PROFILE / DEFAULT_RATIOS / DEFAULT_CATEGORY_META
                 upsert board_settings.<column> = value   (column becomes
                                                            non-null; this
                                                            branch never
                                                            runs again)
                 use value
```
This runs client-side, at the moment a real user actually signs in — not as a one-off server-side backfill script — because the data being migrated (`localStorage`) only exists in that user's own browser; there's no way to read it from anywhere else. It's naturally idempotent: once the column is non-null, the `null` branch is unreachable for that user again, on any device.
Alternative considered: a one-time server-side backfill migration writing `DEFAULT_*` into every existing `board_settings` row. Rejected — it can't see `localStorage`, so it would just be "reset everyone to defaults" wearing a migration's clothes, exactly the outcome this design avoids.

**4. Hooks are reshaped to `useBoardSettings`'s exact signature idiom, not a new one.**
`useProfile`/`useRatios`/`useCategoryMeta` move from `(email: string | undefined)` to `(clientRef: RefObject<BoardSupabaseClient | null>, userId: string | undefined, email: string | undefined, t: I18nDict)` — the same shape `useBoardSettings`/`useImportCategoryRules` already use, plus `email` (still needed for the one-time `localStorage` read in Decision 3; `useBoardSettings` didn't need this since `badge_colors` had no prior `localStorage` incarnation to migrate from). `load` becomes `load(client, email)` instead of `load(email)`. `save*` becomes `async`, doing a Supabase `upsert` instead of `localStorage.setItem`, and gains its own error state (`profileSaveError`, `ratiosSaveError`, `categoryMetaSaveError`) mirroring `settingsError` in `useBoardSettings`. Each gains a `clear()` (reset to `DEFAULT_*`) for `signOut`, matching `useBoardSettings.clear()`/`useImportCategoryRules.clear()`.
Keeping this identical to the existing pattern (rather than inventing something ratio/profile/categoryMeta-specific) means one idiom to learn for every Supabase-backed settings domain in this codebase, and the reshape is mechanical, not a redesign.

**5. Saves become asynchronous; modals need a save-error surface, not a "saving..." spinner.**
`saveProfile`/`saveRatios`/`saveCategoryMeta` currently close their modal synchronously and instantly. Once they're `await client.from('board_settings').upsert(...)`, a failure (network blip, RLS issue) needs to be visible rather than silently swallowed — exactly the gap `useBoardSettings.settingsError` already closes for badge colors. A full loading-spinner treatment is not required: the upsert of a handful of short fields is fast enough that `useBoardSettings`'s existing UI doesn't bother with one either, and matching that precedent keeps the three modals consistent with the one Supabase-backed settings modal already shipped.

## Risks / Trade-offs

- **[Risk] A user signed in on two devices at once, one on the pre-migration build and one on the post-migration build.** The old build keeps writing to `localStorage` only; the new build reads/migrates/writes to Supabase. If the old-build device saves a change *after* the new-build device has already migrated and moved on, that change is invisible to the new build (it never reads `localStorage` again once the column is non-null) and is silently lost on the old device's next reload of a new-build session. → **Mitigation**: none needed beyond normal deploy practice — this is the same "two tabs on different app versions can disagree" class of risk any live web app’s deploy already has (e.g. the existing PWA update-prompt flow in this codebase exists for a related reason), and the window is small (this is a single-developer/small-user-base app, per this repo's existing scale).
- **[Trade-off] `NULL`-no-default columns mean every read has an extra branch (client code, not a DB constraint) to handle "not migrated yet."** → Accepted; it's a few lines per hook and only ever matters on a user's very first post-deploy load.
- **[Trade-off] No explicit `localStorage` cleanup leaves stale, unused keys in the browser indefinitely.** → Accepted (see Non-Goals); harmless dead data, not worth the extra code path.

## Migration Plan

Additive only, via Supabase MCP/CLI per this repo's convention (never hand-edited on the remote database):
```sql
alter table spending_board.board_settings
  add column profile jsonb,
  add column ratios jsonb,
  add column category_meta jsonb;
```
Existing `board_settings` rows (if any) get `NULL` for all three new columns — the correct starting state per Decision 2, since it's what triggers the client-side migration path on that user's next load. No RLS/grant changes needed — the existing `board_settings` policies (`(select auth.uid()) = user_id`) and grants already cover all columns on the table, new ones included.

Rollback is a normal code revert; the added columns can be left as inert unused columns (nothing depends on their absence) rather than requiring a down-migration.

## Open Questions

None blocking. Worth re-confirming after this ships: whether any real users actually had non-default `localStorage` values for these three keys at deploy time, to sanity-check the migration path actually fired rather than everyone quietly landing on defaults (which would be indistinguishable from "the migration worked but there was nothing to migrate" from the outside).
