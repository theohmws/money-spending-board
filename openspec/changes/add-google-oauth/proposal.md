## Why

Email/password is currently the only way into the board (`AuthScreen.tsx` / `useAuthSession.ts`). Adding Google sign-in removes the "create yet another password" friction for new users and lets returning users authenticate faster, while keeping email/password as a fallback.

## What Changes

- Add a "Continue with Google" button to `AuthScreen.tsx`, placed above the existing email/password form with an "or" divider below it, and Google's official 4-color mark rendered as a one-off inline `<svg>` (sibling to the existing `$` logo badge — outside the `ICON_DEFS`/`ICON_MAP` monochrome single-path icon convention, since that only supports one path/one color).
- Add a `signInWithGoogle` callback to `useAuthSession.ts` that calls `client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })`, with `redirectTo` computed from `window.location.origin` at call time — no hardcoded URLs, works across production, every Vercel preview deployment, and localhost without code changes.
- Reuses the existing `authLoading`/`authError` state — no new state added. On success, `authLoading` is deliberately left `true`: the browser navigates away for the OAuth redirect, so there's nothing to reset locally.
- Add two new i18n keys (`continueWithGoogle`, `authDividerOr`) to `BoardConfig.ts`'s `I18N` dict, TH and EN, mode-agnostic (same label for both `signin`/`signup`, since OAuth has no separate signup step).
- Session resolution after redirect reuses the existing `getSession`/`onAuthStateChange` path in `useAuthSession.ts` — no new session-handling logic; this is the same path used for email/password today.
- Add `signInWithOAuth` to the mocked `auth` object in `useAuthSession.test.ts`, plus tests covering the new callback (including the deliberate `authLoading: true` on success).

**Considered and dropped: Google One Tap.** An earlier iteration of this change used One Tap (Google's auto-appearing overlay prompt, `signInWithIdToken`, client-side nonce, GSI script) instead of a button. It was abandoned in favor of a plain clickable button per explicit product direction — a visible, deliberate call-to-action was wanted, not an automatic overlay a user might not notice or might dismiss without realizing it was there.

**Out of repo scope (dashboard config, not code):**
- Enabling the Google provider in the Supabase Auth dashboard with a Google Cloud OAuth Client ID/Secret.
- Registering production, preview (wildcard), and localhost origins in Supabase's Auth redirect URL allowlist.

## Capabilities

### New Capabilities
- `google-oauth-sign-in`: Google as a second sign-in method on the board's auth screen, alongside email/password, via a visible button using Supabase's OAuth redirect flow, sharing the same session-resolution path (`getSession`/`onAuthStateChange`) already used by `useAuthSession`.

### Modified Capabilities
(none — `spending-board-state`'s composition/session-resolution contract is unchanged; Google sign-in resolves through the same `useAuthSession` session path as email/password.)

## Impact

- **Code**: `src/hooks/useAuthSession.ts`, `src/hooks/useAuthSession.test.ts`, `src/components/board/AuthScreen.tsx`, `src/components/board/BoardCard.tsx` (prop wiring), `src/hooks/useSpendingBoard.ts` (prop wiring), `src/utils/BoardConfig.ts`.
- **Dependencies**: none new — uses `@supabase/supabase-js`'s existing `client.auth.signInWithOAuth`.
- **External config**: Google Cloud Console (OAuth client) and Supabase Auth dashboard (provider + redirect allowlist) — manual, one-time, outside this repo.
- **No breaking changes**: email/password flow is untouched; Google is additive.
