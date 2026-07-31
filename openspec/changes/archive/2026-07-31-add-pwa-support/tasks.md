## 1. Icons

- [x] 1.1 Generate `public/icon-192.png`, `public/icon-512.png` (solid `#0E8F5F` background, centered white "฿" glyph, per design.md Decision 4).
- [x] 1.2 Generate `public/icon-maskable-512.png` with the glyph kept inside the maskable safe-zone circle.

## 2. Manifest route

- [x] 2.1 Add `app/manifest.ts` exporting `MetadataRoute.Manifest` (`export const dynamic = 'force-static'`), with `name`, `short_name`, `start_url: '/'`, `display: 'standalone'`, `background_color: '#EEF1F0'`, `theme_color: '#0E8F5F'`, and the three icons from Task 1.
- [x] 2.2 Add a colocated `app/manifest.test.ts` asserting the manifest shape (required fields present, icons array includes 192/512/maskable entries).

## 3. Root layout metadata

- [x] 3.1 Add `manifest: '/manifest.webmanifest'`, `themeColor: '#EEF1F0'`, and `appleWebApp: { capable: true, statusBarStyle: 'default', title: AppConfig.title }` to the `metadata` export in `app/layout.tsx`.

## 4. Service worker

- [x] 4.1 Write `public/sw.js`: a versioned cache-name constant, an `install` handler precaching the app shell (`/`, `/manifest.webmanifest`, the icon files), an `activate` handler deleting non-matching cache names, and a `fetch` handler that (a) ignores cross-origin requests, (b) network-first-with-offline-fallback for navigation requests, (c) cache-first for same-origin static assets.
- [x] 4.2 Add `public/offline.html`, a minimal static fallback page (board branding, "You're offline" message), precached alongside the shell.

## 5. Registration

- [x] 5.1 Add a small client component (e.g. `src/components/ServiceWorkerRegistration.tsx`) that registers `/sw.js` in a `useEffect`, guarded to `process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator`; renders nothing.
- [x] 5.2 Mount it from `app/layout.tsx` alongside `children`.
- [x] 5.3 Unit test the component's registration-guard logic (skips in dev, skips without `navigator.serviceWorker`, calls `register('/sw.js')` when both conditions hold).

## 6. Verification

- [x] 6.1 `npm run check-types`, `npm run lint`, `npm run test` all clean.
- [x] 6.2 `npm run build-prod` succeeds (static export) and `out/manifest.webmanifest`, `out/sw.js`, `out/icon-192.png`, `out/icon-512.png`, `out/icon-maskable-512.png`, `out/offline.html` all exist in the export output.
- [x] 6.3 Manually verify per the project's `verify` skill: DevTools Application tab shows the manifest parsed with no errors and the service worker activated; simulate offline + reload shows the offline fallback; confirm Supabase network requests still succeed (not intercepted/cached) while online.
