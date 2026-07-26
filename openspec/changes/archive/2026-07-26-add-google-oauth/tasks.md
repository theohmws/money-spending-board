## 1. i18n strings

- [x] 1.1 Add `continueWithGoogle` and `authDividerOr` keys to the `I18nDict` type in `BoardConfig.ts`
- [x] 1.2 Add TH values for both keys to the `th` dict
- [x] 1.3 Add EN values for both keys to the `en` dict

## 2. Hook: useAuthSession

- [x] 2.1 Add `signInWithGoogle` callback: guards on `clientRef.current`, clears `authError`, calls `client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })`, sets `authError` + resets `authLoading` on failure, leaves `authLoading` true on success — mirroring `submitAuth`'s try/error shape
- [x] 2.2 Reuse existing `authLoading`/`authError` state — no new state variables
- [x] 2.3 Return `signInWithGoogle` from the hook

## 3. Component: AuthScreen

- [x] 3.1 Add `signInWithGoogle` to the `Pick<ReturnType<typeof useSpendingBoard>, ...>` prop type
- [x] 3.2 Add the Google button above the email/password form, wired to `signInWithGoogle`, disabled while `authLoading`
- [x] 3.3 Add the "or" divider between the Google button and the email/password form
- [x] 3.4 Add the inline multi-color Google "G" mark `<svg>` directly in this file (not in `ICON_DEFS`), placed inside the button next to the label
- [x] 3.5 Wire `signInWithGoogle` through `useSpendingBoard.ts`'s return object and `BoardCard.tsx`'s `<AuthScreen>` props

## 4. Tests

- [x] 4.1 Add `signInWithOAuth: jest.fn()` to the mocked `auth` object in `useAuthSession.test.ts`
- [x] 4.2 Add a test: calling `signInWithGoogle` invokes `signInWithOAuth` with `provider: 'google'` and a `redirectTo` matching `window.location.origin`
- [x] 4.3 Add a test: a `signInWithOAuth` error sets `authError` to the error's message and resets `authLoading` to `false`

## 5. Manual verification (dashboard config + live check)

- [x] 5.1 Enable Google provider in Supabase Auth dashboard with a Google Cloud OAuth Client ID/Secret
- [x] 5.2 Register the Supabase project's callback URL (`https://yjphlaymjjmbinhmdcqj.supabase.co/auth/v1/callback`) as an **Authorised redirect URI** in Google Cloud Console — hit `Error 400: redirect_uri_mismatch` first, because only the app's own origins were registered there (that list was set up earlier for One Tap's needs, which never redirects through Google's OAuth server so it never hit this check). Adding Supabase's callback URL fixed it. **Authorised JavaScript origins** (app URLs) stayed as-is, unrelated to this error.
- [x] 5.3 Add production, preview (wildcard), and localhost origins to Supabase's Auth redirect URL allowlist
- [x] 5.4 Manually verified end-to-end on localhost: clicked "Continue with Google", completed Google's consent screen, redirected back, session established
- [x] 5.5 Confirm `npm run lint`, `npm run check-types`, and `npm run test` pass

## 6. Abandoned: Google One Tap

An earlier iteration of this change implemented Google One Tap (`useGoogleOneTap.ts`: GSI script loading, client-side nonce generation/hashing, `signInWithIdToken`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`) instead of a button. It was built, tested (including a regression test for a real React Strict Mode double-invoke bug that caused `AbortError: signal is aborted without reason`), and verified as far as an automated browser could take it. It was then explicitly replaced with the button-based approach in this file, per direction that a visible, deliberate call-to-action was wanted over an automatic overlay. All One Tap code, tests, and the `NEXT_PUBLIC_GOOGLE_CLIENT_ID` env var were removed; nothing from that iteration remains in the codebase.
