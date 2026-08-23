-- Supports importing transactions from a credit-card statement PDF (KTC
-- first). See openspec/changes/2026-08-23-import-ktc-credit-card-statement.

-- `source` distinguishes an imported row from a manually-typed one (null =
-- manual); `needs_review` marks an imported row the user hasn't cleaned up
-- in the preview step yet. Both default to the "manually entered, nothing
-- to review" state so existing rows are unaffected.
alter table spending_board.transactions
  add column source text,
  add column needs_review boolean not null default false;

-- A per-user, user-maintained merchant-keyword -> category mapping, used to
-- auto-guess a category for each imported row. DB-backed (not localStorage,
-- unlike ratios/profile/categoryMeta) so it follows the user across
-- devices, since they intend to keep growing this list themselves.
create table spending_board.import_category_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  keyword text not null,
  category text not null check (category in ('needs', 'savings', 'wants')),
  created_at timestamptz not null default now()
);

create index if not exists import_category_rules_user_id_idx
  on spending_board.import_category_rules (user_id);

alter table spending_board.import_category_rules enable row level security;

create policy "Users can view their own import category rules"
  on spending_board.import_category_rules for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own import category rules"
  on spending_board.import_category_rules for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own import category rules"
  on spending_board.import_category_rules for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own import category rules"
  on spending_board.import_category_rules for delete
  using ((select auth.uid()) = user_id);

grant all on spending_board.import_category_rules to authenticated;
grant all on spending_board.import_category_rules to service_role;

-- One row per user, holding small user-editable display settings as a
-- single JSON blob — the DB-backed equivalent of how categoryMeta already
-- persists as one JSON object (just to localStorage instead of here).
-- Currently just the two credit-card-import badge colors; jsonb so a third
-- setting doesn't need its own migration later.
create table spending_board.board_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  badge_colors jsonb not null default
    '{"needsReview":{"color":"#C9A6F2","dark":"#4B2A6B"},"source":{"color":"#7FB3F2","dark":"#1E3A5C"}}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table spending_board.board_settings enable row level security;

create policy "Users can view their own board settings"
  on spending_board.board_settings for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own board settings"
  on spending_board.board_settings for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own board settings"
  on spending_board.board_settings for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant all on spending_board.board_settings to authenticated;
grant all on spending_board.board_settings to service_role;
