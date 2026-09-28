## 1. Schema

- [x] 1.1 Migration `20260928090000_api_tokens.sql`: `spending_board.api_tokens` (`id`, `user_id`, `name`, `token_hash` unique hex-64, `token_prefix`, `created_at`, `last_used_at`), RLS select/insert/delete scoped by `(select auth.uid()) = user_id`, grants to `authenticated`/`service_role`.
- [ ] 1.2 Apply the migration to the `money-spending-board` Supabase project and check `get_advisors`.

## 2. Edge Function

- [x] 2.1 `supabase/functions/shortcut-transaction/payload.ts`: pure request parsing/validation, category guess, bearer extraction; unit tests in `payload.test.ts`.
- [x] 2.2 `supabase/functions/shortcut-transaction/index.ts`: token lookup by hash, `last_used_at` bump, insert/update scoped to the token's user.
- [x] 2.3 `[functions.shortcut-transaction] verify_jwt = false` in `supabase/config.toml`.
- [ ] 2.4 Deploy the function and smoke-test insert/update/invalid-token with curl.

## 3. Board UI

- [x] 3.1 `src/utils/apiTokens.ts` (generate/hash/prefix/endpoint URL) + tests.
- [x] 3.2 `useApiTokens` hook (load/create/revoke, show-once plaintext) + tests; composed in `useSpendingBoard`, loaded on session resolve, cleared on sign-out.
- [x] 3.3 `ApiTokensModal` + "iOS Shortcuts / API" row in `ProfileModal`; Thai/English strings.
- [x] 3.4 "Shortcut" source badge for `source = 'ios_shortcut'` rows.
