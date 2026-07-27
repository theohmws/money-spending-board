-- Moves transactions off `public` into its own schema. Uses ALTER ... SET
-- SCHEMA (not drop/recreate) so this is safe to run against a database that
-- already has real rows in public.transactions — SET SCHEMA preserves the
-- table's data, indexes, constraints, and RLS policies as-is.
create schema if not exists spending_board authorization postgres;

grant usage on schema spending_board to anon;
grant usage on schema spending_board to authenticated;
grant usage on schema spending_board to service_role;

alter table public.transactions set schema spending_board;

-- auto_expose_new_tables defaults to false now, so the Data API roles need
-- explicit grants on the table itself (RLS policies alone aren't enough —
-- see money-spending-board's supabase skill notes on Data API exposure).
grant maintain, references, trigger, truncate on spending_board.transactions to anon;
grant all on spending_board.transactions to authenticated;
grant all on spending_board.transactions to service_role;
