-- Aggregate counts for the pre-login landing page (registered users and
-- transactions logged). Callable by `anon` because visitors haven't signed
-- in yet, so it is SECURITY DEFINER (RLS would otherwise hide every row) and
-- returns only two rounded-down totals — never any row or per-user data.
--
-- Counts are floored to a round figure (the landing page shows them as
-- "1,500+") so exact growth can't be read off a public endpoint, and a count
-- below its minimum comes back as null so the page hides that card instead of
-- advertising a tiny number.
create or replace function spending_board.round_stat(
  n bigint,
  min_shown bigint
)
returns bigint
language sql
immutable
set search_path = ''
as $$
  select case
    when n < min_shown then null
    when n >= 1000 then (n / 500) * 500
    when n >= 100 then (n / 50) * 50
    else (n / 10) * 10
  end;
$$;

create or replace function spending_board.public_stats()
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'users', spending_board.round_stat((select count(*) from auth.users), 10),
    'transactions', spending_board.round_stat(
      (select count(*) from spending_board.transactions), 100
    )
  );
$$;

revoke all on function spending_board.round_stat(bigint, bigint) from public;
revoke all on function spending_board.public_stats() from public;
grant execute on function spending_board.public_stats()
  to anon, authenticated, service_role;
