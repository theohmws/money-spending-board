## 0. Confirm before any write

- [ ] 0.1 Owner confirms the Supabase account and project `yjphlaymjjmbinhmdcqj` (`money-spending-board`) is the one to change. It is under `Apis's Org`, and a second account also exists.
- [x] 0.2 Vault rejected for cost uncertainty (owner asked for no extra cost). Using AES-GCM in an Edge Function with an Edge Function secret instead; see design.md Decision 1.
- [ ] 0.3 Snapshot the pre-change totals: row count of `transactions`, sum of `amount`, and the `monthlyIncome` values.

## 1. Schema (migration A, no data change)

- [ ] 1.1 Create the `encrypt-fields` Edge Function with AES-GCM helpers and the `ENCRYPTION_KEY` secret. No database key.
- [ ] 1.2 Add `transactions.amount_enc bytea` (nullable).
- [ ] 1.3 Create `list_transactions`, `write_transaction`, `update_transaction` SQL functions with `auth.uid()` ownership checks, returning and accepting ciphertext only.
- [ ] 1.4 Revoke direct access to `amount` from `authenticated` and `anon` (keep `service_role` for the Edge Function's RPC call only).

## 2. Backfill (migration B, after 0.1–0.3)

- [ ] 2.1 Encrypt every existing row's `amount` into `amount_enc`.
- [ ] 2.2 Encrypt `profile.monthlyIncome` into `monthlyIncome_enc` for each `board_settings` row, keeping the plaintext until step 4.
- [ ] 2.3 Verify: zero null `amount_enc`, decrypted sum equals the snapshot from 0.3, income round-trips.

## 3. App and Edge Function

- [ ] 3.1 `useTransactions`: read via `list_transactions`, write via `write_transaction` / `update_transaction`. Update `bulkInsertTransactions` for the PDF import.
- [ ] 3.2 `useProfile`: read and write `monthlyIncome` through the encrypted path.
- [ ] 3.3 `shortcut-transaction`: insert and update through `write_transaction` with the token's `user_id`. Keep the existing response shape.
- [ ] 3.4 Grep for direct `from('transactions')` and `monthlyIncome` reads; move any remaining callers.
- [ ] 3.5 Unit tests for the mapping layer and the Edge Function payload path. Run `npm run test`, `npm run lint`, `npm run check-types`.
- [ ] 3.6 Deploy `encrypt-fields` and `shortcut-transaction` via Supabase MCP. Smoke-test one insert, one update, and one month read. Record read latency.

## 4. Drop plaintext (migration C, after verification)

- [ ] 4.1 Owner sign-off, because this step is one-way.
- [ ] 4.2 Drop `transactions.amount` and the plaintext `monthlyIncome` key.
- [ ] 4.3 Run `get_advisors` and record the result.

## 5. Docs

- [ ] 5.1 Update the privacy text in the app and the landing copy to say exactly what is encrypted (amount and income) and what is not (names, memos, dates, categories).
- [ ] 5.2 Update CLAUDE.md's Supabase schema section.
