## Context

The board is a statically exported Next.js app (`output: 'export'`) deployed on Vercel, with a single fixed Supabase project (`NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, read at build time). There is no server-side route of any kind. All auth today is email/password via `useAuthSession.ts`, which owns the single `SupabaseClient` instance and resolves sessions through `client.auth.getSession()` on mount and `client.auth.onAuthStateChange()` thereafter.

Because the app has no server, the standard "OAuth callback route" pattern doesn't apply. Supabase's browser client already handles this: `signInWithOAuth` triggers a full-page redirect to Google, then back to the app with an auth code in the URL; the browser client's default `detectSessionInUrl: true` behavior exchanges it and cleans the URL automatically. The existing `getSession`/`onAuthStateChange` pair therefore requires no new code to pick up the returning session.

Vercel adds one wrinkle: every branch/PR gets its own preview URL, in addition to the production domain and `localhost` in dev. `redirectTo` must resolve correctly for all of them without per-environment config in the repo.

An earlier iteration of this change used Google One Tap instead of a button — Google's own auto-appearing overlay, via the GSI script and `signInWithIdToken`. It was built, tested, and got as far as live verification before being replaced with a plain button per explicit direction: a visible, deliberate call-to-action was wanted over an automatic overlay a user could miss or dismiss without noticing.

## Goals / Non-Goals

**Goals:**
- Add Google as a second sign-in method via a visible button, reusing the existing session-resolution path (`getSession`/`onAuthStateChange`) unchanged.
- Work correctly across production, every Vercel preview URL, and local dev, without hardcoding any origin in code.
- Keep the change additive: zero modification to the email/password flow's behavior.
- Match the existing hook/component conventions (`useAuthSession.ts`'s callback shape, `AuthScreen.tsx`'s prop-pick typing).

**Non-Goals:**
- Account linking/merging (e.g. a user who signed up with email later signing in with Google under the same email) — not addressed by this change; Supabase's default behavior applies as-is.
- Any other OAuth provider (GitHub, etc.) — Google only.
- Google One Tap — tried, then explicitly dropped in favor of a button (see Context).
- Configuring the Google Cloud OAuth client or Supabase's provider/redirect-allowlist settings — dashboard-side, out of repo scope.

## Decisions

**1. Visible button + `signInWithOAuth` redirect, not One Tap.**
A button is unambiguous — the user sees it, decides to click it, and knows what happened. One Tap's auto-appearing overlay is easy to miss, gets dismissed with a cooldown before reappearing, and (as built and tested in the earlier iteration) adds real implementation surface — GSI script lifecycle, client-side nonce generation/hashing, `NEXT_PUBLIC_GOOGLE_CLIENT_ID` as a separate credential, FedCM's `use_fedcm_for_prompt` flag — none of which is needed for a redirect button, since Google's own OAuth consent screen handles everything after the click.

**2. `redirectTo` computed from `window.location.origin` at call time, not hardcoded or env-driven.**
Since the client-side call fires in the browser, `window.location.origin` is always the exact origin the user is currently on (prod domain, a specific preview URL, or `localhost:3000`). This avoids needing a `NEXT_PUBLIC_SITE_URL`-style env var per environment. The trade-off: Supabase's Auth redirect-URL allowlist (dashboard config) must still permit each origin pattern (wildcard for previews) — unavoidable with dynamic OAuth redirects on any static host.

**3. Reuse `authLoading`/`authError`; no new state.**
`submitAuth` and `signInWithGoogle` are mutually exclusive user actions on the same screen. On success, `signInWithOAuth` triggers a full-page navigation almost immediately, so there's nothing meaningful to reset locally — `authLoading` is deliberately left `true` rather than reset to `false`, since resetting it would imply the action is "done" when really the browser is mid-navigation away from the page.

**4. Google's mark rendered as a one-off inline `<svg>`, outside `ICON_DEFS`/`ICON_MAP`.**
`ICON_DEFS` (`BoardConfig.ts`) models every icon as a single path `d` string tinted via one `color`. Google's official mark is 4 colors — forcing it into that convention would trade brand recognizability for a consistency the system wasn't built to support. The existing `$` logo badge in `AuthScreen.tsx` is already a precedent for a hand-placed, one-off visual element on this screen outside `ICON_DEFS`.

**5. Single mode-agnostic button label ("Continue with Google"), not separate signin/signup copy.**
OAuth has no distinct "create account" step from Supabase's perspective — the first successful Google sign-in simply creates the user. A single label avoids a fourth i18n string and an unnecessary `authMode`-driven branch.

**6. Button placed above the email/password form, with a divider below it.**
Establishes Google as the faster default path without removing the fallback.

## Risks / Trade-offs

- **[Risk]** Supabase Auth redirect-URL allowlist misconfigured for a given Vercel preview → sign-in redirect fails or lands on an unexpected origin. **Mitigation**: use Supabase's wildcard pattern support (`https://*-<team>.vercel.app/**`); verify manually against at least one real preview URL.
- **[Risk]** No account-linking story: a user with an existing email/password account who later clicks "Continue with Google" using the same email may end up with two separate Supabase users. **Mitigation**: none in this change; explicitly deferred (see Non-Goals).

## Open Questions

- Should account linking (same email, two auth methods) be addressed in a follow-up change, or is having two independent identities acceptable long-term for this app's scale?
