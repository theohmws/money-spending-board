## Why

Transaction amounts and the user's monthly income are stored as plain `numeric` and plain JSON in `spending_board`. They are sensitive personal financial data, and the landing-page copy and the consumer panel both raised "is my data encrypted?" The current state is only platform encryption at rest, which protects the disk, not the data from anyone who can read the table (a leaked backup, a compromised service role, a SQL console).

## What Changes

- Encrypt `spending_board.transactions.amount` at the column level, using Supabase Vault / pgsodium with a key that never leaves the database. The plaintext `amount` column is removed once the backfill is verified.
- Encrypt `board_settings.profile.monthlyIncome` the same way. Other profile fields (`name`, `avatarColor`) stay plain.
- Reads and writes of encrypted fields go through `SECURITY DEFINER` RPCs that check `auth.uid()` before decrypting. Direct table access to the encrypted columns is revoked from `authenticated` and `anon`.
- The `shortcut-transaction` Edge Function writes through the same RPC with the service role, scoped to the token's `user_id`.
- Existing rows are backfilled in one migration, run only after the owner confirms the target project.
- Monthly totals, Trend and Compare charts keep working because they already aggregate in the browser; only the fetch path changes.

## Out of scope

- Encrypting names, memos, dates, categories, or the reference number. The owner chose amount and income only. Those stay plain and are noted as a known limit in the privacy text.
- Client-side end-to-end encryption where the key lives in the browser. That would make the Shortcut and the Edge Function unable to write without the key.
- Key rotation tooling. Rotation is listed as a follow-up.

## Capabilities

### New Capabilities
- `encrypted-financial-fields`: encryption of `amount` and `monthlyIncome`, the RPC access path, and the backfill.

### Modified Capabilities
- `shortcut-transaction-api`: inserts and updates go through the encrypted-write RPC instead of a direct table write. The request and response shape does not change.
