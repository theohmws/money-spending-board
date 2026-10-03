## 1. Schema

- [x] 1.1 Migration `20260928090000_api_tokens.sql`: `spending_board.api_tokens` (`id`, `user_id`, `name`, `token_hash` unique hex-64, `token_prefix`, `created_at`, `last_used_at`), RLS select/insert/delete scoped by `(select auth.uid()) = user_id`, grants to `authenticated`/`service_role`.
- [x] 1.2 Applied via Supabase MCP to `yjphlaymjjmbinhmdcqj` (migration `api_tokens`); `get_advisors` shows no new findings (only the pre-existing leaked-password-protection warning).

## 2. Edge Function

- [x] 2.1 `supabase/functions/shortcut-transaction/payload.ts`: pure request parsing/validation, category guess, bearer extraction; unit tests in `payload.test.ts`.
- [x] 2.2 `supabase/functions/shortcut-transaction/index.ts`: token lookup by hash, `last_used_at` bump, insert/update scoped to the token's user.
- [x] 2.3 `[functions.shortcut-transaction] verify_jwt = false` in `supabase/config.toml`.
- [x] 2.4 Deployed via Supabase MCP (`shortcut-transaction` v1, `verify_jwt: false`, status ACTIVE).
- [ ] 2.6 Smoke-test against the live function (the build sandbox's egress proxy blocks `*.supabase.co`, so this is left for a real device).

- [x] 2.5 `slip.ts`: K PLUS slip OCR parsing (Thai + English, BE years, OCR-tolerant) + tests; slip mode in `index.ts` with reference-based idempotency and `needs_review = true`.

- [x] 2.7 Bangkok Bank slips: fixture from a real BBL slip; recipient read from the "ไปที่"/"To" label (BBL recipients have no honorific); note falls back to the Shortcut's `album` name instead of a hard-coded "K PLUS".

## 3. Board UI

- [x] 3.1 `src/utils/apiTokens.ts` (generate/hash/prefix/endpoint URL) + tests.
- [x] 3.2 `useApiTokens` hook (load/create/revoke, show-once plaintext) + tests; composed in `useSpendingBoard`, loaded on session resolve, cleared on sign-out.
- [x] 3.3 `ApiTokensModal` + "iOS Shortcuts / API" row in `ProfileModal`; Thai/English strings.
- [x] 3.4 "Shortcut" / "Slip" source badges for `ios_shortcut` / `slip_ocr` rows.
