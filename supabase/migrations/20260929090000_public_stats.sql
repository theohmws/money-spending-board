-- Aggregate counts for the pre-login landing page (registered users and
-- transactions logged). Callable by `anon` because visitors haven't signed
-- in yet, so it is SECURITY DEFINER (RLS would otherwise hide every row) and
-- returns only two totals — never any row or per-user data.
create or replace function spending_board.public_stats()
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'users', (select count(*) from auth.users),
    'transactions', (select count(*) from spending_board.transactions)
  );
$$;

revoke all on function spending_board.public_stats() from public;
grant execute on function spending_board.public_stats()
  to anon, authenticated, service_role;
