# Design: encrypt amount and monthly income

## Decision 1: where the key lives (no extra cost)

Use AES-GCM via WebCrypto inside the `encrypt-fields` Edge Function, with a 256-bit key held in an Edge Function secret. Secrets and Edge Functions are part of the existing project, so this adds no line item.

Rejected: Supabase Vault / pgsodium. Vault is already installed on this project (`supabase_vault` 0.3.1), but the owner asked for a no-extra-cost option, and I could not confirm from the docs or the search whether Vault is billed separately. It is not used.

Consequences:
- The database stores only ciphertext. The key never reaches the database or the browser.
- Reads go browser -> Edge Function (decrypts) -> browser. Writes go browser or Shortcut -> Edge Function (encrypts) -> database.
- Every list and write is one Edge Function call. Expect extra latency per month view; measure it in task 3.6.
- Key rotation needs a re-encryption pass; listed as a follow-up.

## Decision 2: storage shape

- `transactions.amount_enc text` holds `base64(iv || ciphertext)` of the amount as a decimal string, encrypted with AES-GCM and a random 12-byte IV per value. `amount` stays for one migration as nullable, then is dropped.
- `profile.monthlyIncome_enc text` holds the same encoding for the income value inside the JSON blob.
- AES-GCM authenticates each value, so a tampered row fails to decrypt rather than returning a wrong amount.
- The check `amount > 0` moves into the write RPC, since the plaintext column no longer exists for a table check.

## Decision 3: access path

- `spending_board.list_transactions(p_month text)` is a plain SQL function that returns ciphertext for `auth.uid()` only. The Edge Function decrypts it.
- `spending_board.write_transaction(...)` and `update_transaction(...)` accept an already-encrypted value from the Edge Function and check ownership.
- `public_stats()` already reads counts only and is unaffected.
- Direct `select`, `insert`, `update` on `amount_enc` are revoked from `authenticated` and `anon`. RLS stays as defence in depth.
- New Edge Function `encrypt-fields`: authenticates the user (JWT for the app, token hash for the Shortcut), encrypts or decrypts, and calls the RPCs with the user's id. The Shortcut endpoint `shortcut-transaction` calls the same encryption module.

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
