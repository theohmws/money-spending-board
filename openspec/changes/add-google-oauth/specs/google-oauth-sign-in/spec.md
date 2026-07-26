## ADDED Requirements

### Requirement: User can sign in with Google from the auth screen
The auth screen SHALL offer a "Continue with Google" button, positioned above the email/password form with a divider between them, as a second sign-in method alongside email/password.

#### Scenario: Google button visible regardless of signin/signup mode
- **WHEN** the auth screen renders, whether `authMode` is `signin` or `signup`
- **THEN** the same single "Continue with Google" button is shown, with no separate label or behavior per mode

#### Scenario: Clicking the button starts the OAuth redirect
- **WHEN** the user clicks "Continue with Google"
- **THEN** `useAuthSession` invokes `client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })` on the shared Supabase client instance

### Requirement: OAuth redirect target is computed dynamically, never hardcoded
`redirectTo` SHALL be derived from `window.location.origin` at the moment `signInWithGoogle` is called, so the same code works unmodified across production, every Vercel preview deployment, and local development.

#### Scenario: Redirect target matches the current origin
- **WHEN** `signInWithGoogle` is invoked from any origin (production domain, a Vercel preview URL, or `localhost`)
- **THEN** the `redirectTo` passed to `signInWithOAuth` equals that origin, with no hardcoded URL or environment-specific branching in the code

### Requirement: Returning session resolves through the existing session-resolution path
After the OAuth redirect completes and the browser returns to the app, the session SHALL be picked up by the same `getSession`/`onAuthStateChange` logic `useAuthSession` already uses for restoring sessions and for email/password sign-in — no separate OAuth-specific session-handling code path.

#### Scenario: Session established after Google redirect returns
- **WHEN** the browser navigates back to the app after a successful Google authentication
- **THEN** `client.auth.onAuthStateChange` (or `getSession` on next mount) resolves a non-null session
- **AND** the composition root's existing session-resolved behavior (loading transactions, ratios, profile, category metadata) runs exactly as it does for email/password sign-in, with no Google-specific branch

### Requirement: Google sign-in shares loading and error state with email/password sign-in
`signInWithGoogle` SHALL reuse the existing `authLoading`/`authError` state in `useAuthSession` rather than introducing separate state for the Google path.

#### Scenario: signInWithOAuth call fails
- **WHEN** `client.auth.signInWithOAuth` resolves with an error (e.g. misconfigured provider)
- **THEN** `authError` is set to that error's message, `authLoading` is reset to `false`, using the same state and the same error banner in `AuthScreen` that email/password errors use

#### Scenario: signInWithOAuth call succeeds
- **WHEN** `client.auth.signInWithOAuth` succeeds
- **THEN** `authLoading` is deliberately left `true` — the browser navigates away for the OAuth round trip, so there is nothing to reset locally

### Requirement: Google's brand mark renders outside the shared monochrome icon system
The Google "G" mark on the button SHALL be implemented as its own inline multi-color SVG, not added to `ICON_DEFS`/`ICON_MAP`, since that system supports only a single path tinted by one color and Google's official mark requires four.

#### Scenario: Icon system is unmodified
- **WHEN** the Google button is implemented
- **THEN** `ICON_DEFS` and `ICON_MAP` in `BoardConfig.ts` contain no new entry for Google
- **AND** the Google mark's SVG lives directly in `AuthScreen.tsx`, alongside the existing `$` logo badge
