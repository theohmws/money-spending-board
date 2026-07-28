-- Perf: wrap auth.uid() in a scalar subquery so Postgres evaluates it once
-- per statement instead of once per row (fixes the auth_rls_initplan
-- advisor warning on all four policies).
drop policy "Users can view their own transactions" on spending_board.transactions;
create policy "Users can view their own transactions"
  on spending_board.transactions for select
  using ((select auth.uid()) = user_id);

drop policy "Users can insert their own transactions" on spending_board.transactions;
create policy "Users can insert their own transactions"
  on spending_board.transactions for insert
  with check ((select auth.uid()) = user_id);

drop policy "Users can update their own transactions" on spending_board.transactions;
create policy "Users can update their own transactions"
  on spending_board.transactions for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy "Users can delete their own transactions" on spending_board.transactions;
create policy "Users can delete their own transactions"
  on spending_board.transactions for delete
  using ((select auth.uid()) = user_id);

-- Security: anon previously had blanket SELECT/INSERT/UPDATE/DELETE on this
-- table (a legacy auto-expose default), relying entirely on RLS to block
-- anonymous access. RLS still blocks it (auth.uid() is null for anon), but
-- there's no reason for anon to hold table-level write grants on a table
-- that's exclusively per-user financial data. authenticated keeps full CRUD.
revoke select, insert, update, delete on spending_board.transactions from anon;
