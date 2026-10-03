-- Extends spending_board.board_settings (added for badge_colors in the KTC
-- import change) with three more per-user JSON settings columns, so
-- ratios/profile/categoryMeta — until now localStorage-only, per
-- src/hooks/useRatios.ts/useProfile.ts/useCategoryMeta.ts — persist to
-- Supabase and sync across a user's devices.
--
-- Deliberately nullable with NO default: NULL is the "not yet migrated for
-- this user" signal the client-side migration path relies on (see
-- design.md Decision 2 in
-- openspec/changes/2026-08-24-migrate-profile-ratios-categorymeta-to-supabase)
-- to distinguish "never set" from "already holds a real value" — a
-- populated default would make a pre-existing board_settings row (e.g. from
-- setting badge colors) look already-migrated and skip copying in a user's
-- real localStorage data.
alter table spending_board.board_settings
  add column profile jsonb,
  add column ratios jsonb,
  add column category_meta jsonb;
