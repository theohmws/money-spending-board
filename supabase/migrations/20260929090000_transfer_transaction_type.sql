-- Adds a 'transfer' transaction type (moving money between the user's own
-- accounts). Transfers carry no category and are excluded from income and
-- expense totals.
alter table spending_board.transactions
  drop constraint if exists transactions_type_check;

alter table spending_board.transactions
  add constraint transactions_type_check
  check (type in ('expense', 'income', 'transfer'));
