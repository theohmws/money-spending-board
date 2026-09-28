-- Personal API tokens, so something outside the browser session (an iOS
-- Shortcut) can insert/update the owner's transactions through the
-- `shortcut-transaction` Edge Function. See
-- openspec/changes/2026-09-28-ios-shortcuts-transaction-api.
--
-- Only a SHA-256 hex digest of each token is stored: the plaintext is shown
-- to the user exactly once, when the board generates it client-side. The
-- Edge Function hashes the bearer token it receives and looks the digest up
-- here with the service role, so it can't be used to recover a token.
create table spending_board.api_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  -- First few characters of the plaintext (e.g. "msb_AbCd"), so the user
  -- can tell tokens apart in the list without the full secret.
  token_prefix text not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create index if not exists api_tokens_user_id_idx
  on spending_board.api_tokens (user_id);

alter table spending_board.api_tokens enable row level security;

-- No update policy: a token is immutable from the client (last_used_at is
-- only ever written by the Edge Function via the service role). Revoking
-- is a delete.
create policy "Users can view their own api tokens"
  on spending_board.api_tokens for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own api tokens"
  on spending_board.api_tokens for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own api tokens"
  on spending_board.api_tokens for delete
  using ((select auth.uid()) = user_id);

grant select, insert, delete on spending_board.api_tokens to authenticated;
grant all on spending_board.api_tokens to service_role;
