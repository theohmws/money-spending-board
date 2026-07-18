-- Table backing src/hooks/useSpendingBoard.ts once a user connects real
-- Supabase credentials (msb_supabase_config). `id` is client-generated
-- (src/utils/boardHelpers.ts uid()) and is not a uuid, so it stays `text`.
create table if not exists public.transactions (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('expense', 'income')),
  category text check (category in ('needs', 'savings', 'wants')),
  note text not null default '',
  amount numeric not null check (amount > 0),
  date date not null,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_id_idx
  on public.transactions (user_id);
create index if not exists transactions_user_id_date_idx
  on public.transactions (user_id, date desc);

alter table public.transactions enable row level security;

create policy "Users can view their own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own transactions"
  on public.transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);
