## Why

Transactions created by the "Upload Bank Slip" Shortcut come from OCR and are flagged "Needs review", but the user has no way to look at the original slip while reviewing. The photo is already on the iPhone that uploaded it, so the board only needs a pointer back to it — no image upload or storage.

## What Changes

- New nullable column `spending_board.transactions.slip_ref text`: the slip photo's creation timestamp, exactly as the Shortcut sends it in `ts`.
- The `shortcut-transaction` edge function stores `ts` in `slip_ref` for slip uploads.
- `TransactionList` shows an "Open slip photo" icon button on rows with a `slip_ref`, **only on iOS devices**. It links to `shortcuts://run-shortcut?name=Open%20Slip&input=text&text=<slip_ref>`.
- The user creates a companion Shortcut named "Open Slip" (text input → Find Photos by Date Created → Quick Look). iOS has no URL for a specific Photos asset, so this Shortcut does the lookup, which is also why it only works on the device that holds the photo.
- `ApiTokensModal` gets a short Thai/English note explaining how to build that Shortcut.

## Capabilities

### New Capabilities
- `slip-photo-link`: persisting the slip photo pointer and opening the photo from a transaction row on the uploading iPhone.

### Modified Capabilities
(none — `shortcut-transaction-api` gains one stored field; no existing requirement changes.)
