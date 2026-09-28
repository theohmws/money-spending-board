## Why

Adding a transaction today means opening the board, signing in and filling in `AddTransactionModal`. On an iPhone the fastest capture path is an iOS Shortcut (share sheet, Back Tap, an automation on a Wallet/Apple Pay transaction, Siri). Shortcuts can call an HTTP endpoint but can't hold a Supabase browser session, so the board needs an endpoint that authenticates with something a Shortcut *can* carry: a long-lived, revocable, per-user API token.

## What Changes

- New Supabase Edge Function `shortcut-transaction` (`POST /functions/v1/shortcut-transaction`, `Authorization: Bearer msb_…`). A JSON body without `id` inserts a transaction; with `id`, it updates only the fields sent on that (owned) transaction.
- New table `spending_board.api_tokens` holding only a SHA-256 digest of each token (plus a short display prefix, name, `last_used_at`). RLS lets a user list/create/delete their own tokens; nobody can read the plaintext back.
- New "iOS Shortcuts / API" entry in `ProfileModal` opening `ApiTokensModal`: shows the endpoint URL, creates a named token (shown once, with copy), lists tokens with last-used time, revokes them, and shows how to set up the Shortcut.
- Rows created through the endpoint get `source = 'ios_shortcut'` and a "Shortcut" source badge in `TransactionList`, reusing the existing source-badge color.
- The same endpoint accepts the user's existing "Upload Bank Slip to OCR" Shortcut body (`{ ts, text, album }` — on-device OCR text of each K PLUS slip screenshot taken today). The slip text is parsed server-side into amount, date, reference number, memo and recipient; rows are saved as `source = 'slip_ocr'` with `needs_review = true` (OCR is a guess) and a "Slip" badge, and re-sending the same slip is a no-op.
- An expense sent without a `category` is auto-categorized from the note using the same `import_category_rules` keywords the PDF import uses (default `wants`).

## Capabilities

### New Capabilities
- `shortcut-transaction-api`: API tokens (create/list/revoke), the token-authenticated insert/update endpoint, and its request validation.

### Modified Capabilities
(none — `TransactionList`'s source badge already exists; it gains one more label.)
