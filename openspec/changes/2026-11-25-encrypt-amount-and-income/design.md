# Design: encrypt amount and monthly income

## Decision 1: where the key lives

Use Supabase Vault (pgsodium-backed) for the key. The key is created once in `vault.secrets` and read only inside `SECURITY DEFINER` functions. Application code, the browser and the Edge Function never see it.

Alternative rejected: an app-side AES-GCM key in an Edge Function secret. That spreads the key across the browser (for reads), the Edge Function and the database, which is the wider exposure we are trying to remove.

Open question: confirm the current Supabase Vault and pgsodium availability and pricing on the project before implementation. The earlier search did not confirm whether Vault is billed separately. Also confirm the recommended pgsodium API (AEAD with a random nonce per value, not the deterministic variant) against the current docs, because deterministic encryption leaks equality between amounts.

## Decision 2: storage shape

- `transactions.amount_enc bytea` holds the nonce and AEAD ciphertext of the amount, stored as text of the number. `amount` stays for one migration as nullable, then is dropped.
- `profile.monthlyIncome_enc text` holds the same encoding for the income value inside the JSON blob.
- The check `amount > 0` moves into the write RPC, since the plaintext column no longer exists for a table check.

## Decision 3: access path

- `spending_board.list_transactions(p_month text)` returns rows with `amount` decrypted, filtered to `auth.uid()`.
- `spending_board.write_transaction(...)` and `update_transaction(...)` encrypt before insert/update and check ownership.
- `public_stats()` already reads counts only and is unaffected.
- Direct `select`, `insert`, `update` on `amount_enc` are revoked from `authenticated` and `anon`. RLS stays as defence in depth.
- Edge Function: calls `write_transaction` with the service role and passes the token's `user_id` explicitly, matching the existing explicit-scoping rule.

## Decision 4: migration and rollback

1. Migration A: add `amount_enc` and `monthlyIncome_enc`, create the Vault key and the functions. No data change.
2. Backfill (separate migration, run after owner confirms the project): encrypt every existing row, then verify the count of rows with a null `amount_enc` is zero and that the sum of decrypted amounts equals the plaintext sum captured beforehand.
3. Switch the app and the Edge Function to the RPCs and deploy.
4. Migration B, only after a verification period: drop plaintext `amount` and the income field from the JSON.

Rollback before step 4: restore reads to the plaintext column, which still holds the data. After step 4 there is no plaintext copy, so the rollback is restoring from backup and is treated as a one-way step that needs owner sign-off.

## Risks

- Charts and totals are computed in the browser from decrypted rows. Large histories mean more rows fetched per month. Acceptable at current volume (352 transactions).
- Any direct query outside the RPCs breaks after step 3. Grep for `from('transactions')` and `board_settings` before switching.
- The PDF import path (`bulkInsertTransactions`) also writes amounts and must move to the RPC.
