-- The user's own names (Thai and/or English), used by the Shortcuts slip
-- upload to recognise a transfer between the user's own accounts: a slip
-- whose recipient matches one of these is saved as a 'transfer', not an
-- expense.
alter table spending_board.board_settings
  add column own_names text[] not null default '{}';
