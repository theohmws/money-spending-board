## Context

The app is fully statically exported (`next.config.js`: `output: 'export'`) — every route in `app/` is prerendered to static HTML/JSON at build time, with `app/sitemap.ts`/`app/robots.ts` already using the native Next Metadata API route convention (`export const dynamic = 'force-static'`) instead of a runtime endpoint. `app/layout.tsx` is the single root layout wrapping every route (`about`, `blog`, and the board at `/`), and already sets `metadata.icons` there. There's no existing service worker, manifest, or PWA tooling anywhere in the repo (`grep` for `pwa`/`manifest`/`service.?worker` across source turns up nothing but a stray `package-lock.json` hit).

Two things make this a genuinely thin change rather than a new subsystem:
- Next 13+ supports `app/manifest.ts` (returns `MetadataRoute.Manifest`) as a first-class static-export-compatible route, exactly parallel to the sitemap/robots files already in the repo — no new dependency, no divergent pattern.
- The app has no server-rendered/dynamic pages to reason about cache-invalidation for; every asset the service worker would precache is already a fingerprinted static file from the Next build (`_next/static/...`), so cache-busting is "the browser re-downloads `sw.js` and its precache list changes because the build's asset hashes changed" — the standard static-export SW story, no custom versioning scheme needed beyond bumping a cache-name constant.

## Goals / Non-Goals

**Goals:**
- Board is installable (manifest with `name`, icons, `display: standalone`) on Android/desktop Chrome and add-to-home-screen on iOS Safari (via `apple-touch-icon` + `appleWebApp` metadata, already partly present).
- A dropped connection while navigating shows a small offline fallback page instead of the browser's default network-error interstitial.
- Zero new npm dependencies (no `next-pwa`, no `workbox`) — hand-rolled manifest route + a small hand-written service worker, consistent with the graphs feature's "no charting library" precedent (`2026-07-27-add-spending-graphs`).

**Non-Goals:**
- No offline *data* — transactions still require live Supabase connectivity; the SW's offline fallback is a shell-level "you're offline" page, not a background-sync/queue system for writes made while disconnected.
- No push notifications (out of scope; would need a backend push endpoint that doesn't exist).
- No update-available UI/toast (browsers already auto-check `sw.js` for byte-diffs and activate on next load; a "new version available, refresh?" prompt is a reasonable future add-on, not required for v1).
- No change to `about`/`blog` content or the site-wide `Main` template — they inherit the manifest/SW registration for free via the shared root layout, but aren't the target of this change.

## Decisions

**1. Manifest via `app/manifest.ts`, not a static `public/manifest.json`.**
Matches the existing `app/sitemap.ts`/`app/robots.ts` convention exactly (native Metadata API route, `export const dynamic = 'force-static'` for static-export compatibility) rather than introducing a second, inconsistent way to ship metadata. `app/layout.tsx`'s `metadata.manifest` field points to the emitted `/manifest.webmanifest`.
Alternative considered: a hand-written `public/manifest.json`. Rejected — would be the only piece of route-level metadata in the app not using the Metadata API, diverging from an established local convention for no benefit.

**2. Service worker is a single hand-written `public/sw.js`, registered from a small client component, not a library.**
The precache list is short and fixed (app shell: `/`, `/manifest.webmanifest`, the two new icon files, one offline fallback page) — small enough to hand-maintain, and this repo's stated bias (per the graphs feature) is to avoid a dependency when the hand-rolled version is bounded and simple. Fetch handling:
- Navigation requests (`request.mode === 'navigate'`): network-first, falling back to the cached offline page only on fetch failure (offline). This keeps the live app (including auth/session state) always fresh when online, and only degrades when there's truly no network.
- Same-origin static assets (`_next/static/...`, icons, manifest): cache-first (immutable, fingerprinted filenames — safe to cache aggressively).
- Everything else (notably all Supabase API calls, which are cross-origin) is left untouched — no `respondWith`, falls through to normal network fetch. The SW must never intercept or cache Supabase requests; caching an auth/session-bearing API response would be both wrong (stale data) and a potential data-leak-across-users footgun on a shared device.
Alternative considered: `next-pwa`/`workbox` for precache-manifest generation. Rejected for v1 — the precache list is static and short enough that a generated manifest is unneeded machinery; revisit only if the shell's asset list grows unpredictably.

**3. Registration is a client component mounted in `app/layout.tsx`, guarded to production + capable browsers.**
`if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator)` — registering in development would fight Next's dev-mode fast-refresh/HMR (a SW aggressively caching `_next/static` chunks mid-development is a classic footgun). The registration component renders nothing (`null`) — it's a side-effect-only `useEffect`, not UI.

**4. New icons are hand-rendered PNGs (192×192, 512×512, plus a maskable 512×512), not derived from the existing 180×180 `apple-touch-icon.png`.**
Upscaling a 180px source to 512px would visibly soften/blur. Icons are generated fresh at target resolution: a solid `#0E8F5F` (the board's existing brand green — already used for income amounts/avatar default throughout `src/`) rounded-square background with a centered white "฿" glyph (the app's actual currency symbol, already the visual language of every amount on the board via `fmtMoney`) — reuses existing brand color/symbol rather than inventing new iconography. The maskable variant keeps the glyph within the safe-zone circle (per the maskable-icon spec) so Android's adaptive-icon masking doesn't clip it.
Alternative considered: reuse `nextjs-starter-banner.png` or the 💰 emoji from `AppConfig.site_name`. Rejected — the banner is unrelated boilerplate artwork, and color-emoji rendering depends on a system emoji font not guaranteed present in the icon-generation environment; a hand-drawn glyph in an available font is deterministic and reproducible.

**5. `metadata.themeColor`/`appleWebApp` added to the existing root `metadata` export in `app/layout.tsx`, not a new file.**
`themeColor: '#EEF1F0'` (light) matches the board's light-mode `pageBg` from `themeTokens` in `boardHelpers.ts` — the same color a standalone/installed window's title bar and iOS status bar should show behind the board. `appleWebApp: { capable: true, statusBarStyle: 'default', title: AppConfig.title }` covers iOS's non-standard install metadata (Safari doesn't read the W3C manifest for this). Both are additive fields on the object literal that already sets `title`/`description`/`icons`/`openGraph`.

## Risks / Trade-offs

- **[Risk] A cached service worker can serve a stale app shell after a deploy if the cache-name constant isn't bumped.** → Mitigation: cache name embeds a version string (e.g. `msb-shell-v1`) bumped whenever the precached file list changes; `sw.js`'s `activate` handler deletes any cache not matching the current name. Documented as a manual step (bump the constant) rather than automated versioning, matching the "small hand-written file" decision in #2.
- **[Trade-off] No background sync / offline writes.** → Accepted for v1 per Non-Goals; the offline fallback is purely "don't show a broken network error," not "let me log a transaction with no signal." Revisit only if users specifically ask for offline transaction entry.
- **[Risk] Service worker accidentally intercepting a Supabase request would be a real correctness/security bug (stale or cross-user cached data).** → Mitigated structurally by Decision 2's explicit "same-origin only" scoping (the fetch handler checks `new URL(request.url).origin === self.location.origin` before doing anything; cross-origin requests fall through untouched) — verified by a unit-style assertion on the scoping logic (see tasks.md) rather than relying on the strategy list to stay accurate by convention alone.

## Migration Plan

Frontend-only, purely additive (new files + additive `metadata` fields; no existing returned shape of `useSpendingBoard` or any component prop changes). No feature flag needed. No data migration. Rollback is a normal revert; a previously-installed PWA on a user's device would keep the old cached `sw.js` until it next re-fetches and diffs it (standard browser SW lifecycle), which is acceptable given the SW does no data mutation.

## Open Questions

None blocking. A future "new version available" update-toast (surfacing the SW's `waiting` state via `registration.onupdatefound`) is a reasonable v2 if users report seeing stale shells after a deploy, but isn't required to ship v1.
