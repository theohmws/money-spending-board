## Why

The board is a daily-use tool (log a transaction, check the split) but today it only exists as a browser tab: no home-screen icon, no standalone window, no offline fallback if a connection drops mid-session. Since the app is already statically exported (`output: 'export'`), it's a natural fit for installability — there's no server-rendered/dynamic surface that would complicate a service worker's caching story.

## What Changes

- **Web app manifest**: a `manifest.webmanifest` (via Next's native `app/manifest.ts` route, same pattern as the existing `app/sitemap.ts`/`app/robots.ts`) declaring name, short name, `standalone` display, theme/background colors matching the board's light-mode palette, and icon references.
- **App icons**: new 192×192, 512×512, and maskable-512 PNG icons for the manifest's `icons` array, derived from a user-supplied illustrated app-icon graphic (a rounded-square dashboard scene in the board's navy/green palette) — the existing favicon/apple-touch-icon set is unchanged and untouched.
- **Service worker**: a hand-written `public/sw.js` (no `next-pwa`/`workbox` dependency) that precaches the static export's core shell (`/`, manifest, icons) and serves a small offline fallback when a navigation request fails with no network — this is a "don't show the browser's dinosaur/dino error" safety net, not full offline data sync (transactions still require Supabase connectivity).
- **Registration**: a tiny client-side registration snippet wired into `app/layout.tsx` (guarded to production + browsers with `serviceWorker` support), plus `manifest`/`themeColor`/`appleWebApp` additions to the root `metadata` export.
- Root/`about`/`blog` all get the installable manifest for free (it's registered at the layout level) — the board (`app/page.tsx`) is the primary beneficiary since it's the actual product surface.

## Capabilities

### New Capabilities
- `pwa-support`: covers the manifest's required fields/icons, the service worker's install/cache/offline-fallback behavior, and registration being scoped to production + capable browsers only.

### Modified Capabilities
(none — purely additive; no existing requirement in `site-metadata` or elsewhere changes. `app/layout.tsx`'s `metadata` export gains fields, it doesn't change existing ones.)

## Impact

- New: `app/manifest.ts`, `public/sw.js`, `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable-512.png`.
- `app/layout.tsx`: add `manifest`, `themeColor`, `appleWebApp` to `metadata`; mount a small client component that registers the service worker.
- No changes to `src/hooks/useSpendingBoard.ts` or any board domain logic — this is a shell-level, cross-cutting concern, not board state.
- No new npm dependency (hand-rolled manifest route + service worker, consistent with the graphs feature's "no charting library" precedent).
- No backend/schema change.
