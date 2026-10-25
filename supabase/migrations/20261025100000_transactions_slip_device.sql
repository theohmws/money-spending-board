-- Name of the device that uploaded the slip (the Shortcut's "Device Name"),
-- so the board only offers the "Open slip photo" button on the one device
-- whose Photos library holds the picture, not on every iPhone/iPad.
alter table spending_board.transactions
  add column slip_device text;
