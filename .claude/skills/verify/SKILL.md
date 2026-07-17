---
name: verify
description: Build/launch/drive recipe for manually verifying UI changes to money-spending-board in a real browser.
---

# Verifying money-spending-board

This is a Next.js 16 App Router app (static export). There is no CI-runnable e2e here that
covers the board UI (Cypress specs are stale/pre-existing and not part of the required gate) —
verification of UI changes means driving it in a real browser.

## Launch

```bash
npm run dev   # http://localhost:3000, Turbopack, ready in ~1s
```

No env vars needed — the board defaults to "demo mode" (localStorage-backed), no Supabase
project required to exercise the full UI.

## Drive it

Playwright isn't a project dependency, but the environment ships a global install:

```bash
NODE_PATH=/opt/node22/lib/node_modules node your-script.js
```

with `chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })`.

Golden path through the board (`app/page.tsx` -> `BoardCard`):
1. Sign in with any email/password (demo mode auto-creates the account) — `#auth-email`,
   `#auth-password`, button text `เข้าสู่ระบบ` (Thai) / `Sign in` (English).
2. Dashboard loads with seeded demo transactions — wait for text `กิจกรรมล่าสุด` /
   `Recent activity`.
3. Add a transaction via the `เพิ่มรายการ` / `+ Add transaction` button — `#tx-amount`,
   `#tx-note`.
4. Edit the ratio split via `แก้ไขสัดส่วน` / `Edit ratio` — Save is disabled unless the three
   inputs sum to exactly 100.
5. Toggle language with the `EN`/`TH` chip in the header.
6. Reload — session/theme/lang persist via `localStorage` (`msb_demo_session`, `msb_theme`,
   `msb_lang`).

## Known non-blocking noise

`global.css` imports IBM Plex Sans Thai from `fonts.googleapis.com` at runtime; this sandbox's
network blocks it (`net::ERR_CONNECTION_RESET` in the browser console). Pre-existing, unrelated
to app code — real deployments with outbound internet won't see this.
