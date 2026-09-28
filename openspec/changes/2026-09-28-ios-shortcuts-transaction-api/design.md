## Context

The board is a static export (`output: 'export'`), so there is no Next.js server to host an API route. Everything server-side already lives in Supabase.

## Decisions

### 1. Supabase Edge Function, not a PostgREST RPC
A `security definer` RPC reachable at `/rest/v1/rpc/...` would need the Shortcut to also send the publishable `apikey` header and a `Content-Profile: spending_board` header, and every error would surface as a PostgREST error shape. An Edge Function gives a single clean URL, a normal `Authorization: Bearer` header, and plain JSON errors with meaningful status codes (400/401/404/405). It's deployed with `verify_jwt = false` (`supabase/config.toml`) because the bearer is our token, not a Supabase JWT.

### 2. Opaque tokens, hashed at rest, generated in the browser
Tokens are `msb_` + 32 random bytes (base64url). The browser generates the token and inserts only its SHA-256 hex digest through the normal RLS-protected client — no RPC needed, and the plaintext never reaches Supabase at rest. SHA-256 (not bcrypt/argon) is appropriate because the token has 256 bits of entropy; it only needs to be irreversible, not brute-force-resistant. The `msb_` prefix lets the function reject obvious non-tokens (e.g. a pasted Supabase JWT) before touching the database.

### 3. Service role inside the function, with explicit `user_id` scoping
After resolving the token to a `user_id`, the function uses the service role (RLS bypassed) and adds `.eq('user_id', userId)` to every query. An update against an id the caller doesn't own returns 404, indistinguishable from a missing row.

### 4. One endpoint, insert-or-update by presence of `id`
Shortcuts' "Get Contents of URL" is easiest with a single fixed URL and method. `id` present → partial update (only sent fields change; switching to `income` clears `category`, matching the in-app form). `id` absent → insert, where only `amount` is required; `type` defaults to `expense`, `date` to today in `Asia/Bangkok` (overridable via the `BOARD_TIMEZONE` secret) so a 06:00 Bangkok entry doesn't land on yesterday in UTC.

### 5. Lenient input parsing
Shortcuts often send numbers as text and may include locale formatting, so `amount` accepts `"1,234.50"`, `"฿120"`, etc.; `type`/`category` are case-insensitive; `date` accepts `YYYY-MM-DD` or a full ISO 8601 timestamp (calendar date taken as-is). Validation lives in `payload.ts`, which has no imports so it's shared verbatim between Deno and jest.

### 6. `needs_review` untouched
Shortcut-created rows are `needs_review = false` — the user entered them deliberately. API updates don't change `needs_review`.

## Risks

- A leaked token grants write access (insert/update, not delete or read-all) to the owner's transactions until revoked. Mitigated by: shown-once plaintext, per-device naming, `last_used_at` visibility, one-click revoke.
