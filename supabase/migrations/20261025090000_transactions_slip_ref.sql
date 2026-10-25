-- Pointer back to the slip photo a Shortcut-uploaded transaction came from:
-- the photo's creation timestamp exactly as the Shortcut sent it (`ts`). The
-- image itself is never uploaded — the board builds a `shortcuts://` link
-- from this value that a companion "Open Slip" Shortcut on the same iPhone
-- uses to find the photo in the Photos library.
alter table spending_board.transactions
  add column slip_ref text;
