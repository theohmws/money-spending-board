## ADDED Requirements

### Requirement: App exposes a web app manifest declaring it as installable
The app SHALL expose a web app manifest (via `app/manifest.ts`, statically generated) declaring `name`, `short_name`, `start_url`, `display: standalone`, `background_color`, `theme_color`, and an `icons` array containing at least 192×192 and 512×512 entries plus one `purpose: maskable` entry. `app/layout.tsx`'s `metadata` SHALL reference the manifest and include `themeColor` and `appleWebApp` fields so both the W3C manifest path (Android/desktop Chrome) and Apple's non-manifest install metadata (iOS Safari) are covered.

#### Scenario: Manifest is reachable and well-formed
- **WHEN** a browser requests `/manifest.webmanifest`
- **THEN** it receives a JSON document with `name`, `short_name`, `start_url`, `display: "standalone"`, `background_color`, `theme_color`, and an `icons` array with 192×192 and 512×512 PNG entries, one of which has `purpose: "maskable"`

#### Scenario: Root layout links the manifest and iOS install metadata
- **WHEN** any page under the root layout renders (board, about, or blog)
- **THEN** the document's metadata includes a link to the manifest and `appleWebApp` capability metadata, so "Add to Home Screen" works on both Android/desktop and iOS

### Requirement: A service worker precaches the static app shell and provides an offline navigation fallback
The app SHALL register a same-origin service worker (`/sw.js`) that precaches the app shell (the root document, the manifest, and the icon files) on install, and serves a cached offline fallback page for navigation requests that fail due to no network connectivity. The service worker SHALL NOT intercept or cache cross-origin requests (including all Supabase API calls) — those SHALL always pass through to the network untouched.

#### Scenario: Offline navigation shows a fallback instead of a browser error
- **WHEN** a user with the service worker already installed navigates the app while offline
- **THEN** they see the cached offline fallback page instead of the browser's default network-error interstitial

#### Scenario: Supabase requests are never intercepted
- **WHEN** the service worker's `fetch` handler receives a request whose origin differs from the app's own origin
- **THEN** it does not call `respondWith` and the request proceeds to the network exactly as if no service worker were installed

#### Scenario: Same-origin static assets are cache-first
- **WHEN** the service worker's `fetch` handler receives a same-origin GET request for a fingerprinted static asset (e.g. `_next/static/...`, an icon file)
- **THEN** it serves the cached copy if present, only falling back to network on a cache miss

#### Scenario: Stale caches are cleaned up on activation
- **WHEN** a new service worker version activates (its precache cache-name constant differs from a previously-installed version's)
- **THEN** it deletes any previously-created cache that doesn't match the current cache name

### Requirement: Service worker registration is scoped to production and capable browsers only
The app SHALL register the service worker only when running in a production build and only in browsers that expose `navigator.serviceWorker`. It SHALL NOT attempt registration in development mode.

#### Scenario: No registration attempt in development
- **WHEN** the app runs with `NODE_ENV !== 'production'` (e.g. `npm run dev`)
- **THEN** no service worker registration is attempted, regardless of browser support

#### Scenario: No crash in unsupported browsers
- **WHEN** the app runs in production in a browser without `navigator.serviceWorker`
- **THEN** registration is skipped silently with no thrown error
