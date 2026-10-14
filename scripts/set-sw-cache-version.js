// Keeps public/sw.js's CACHE_NAME in sync with package.json's version, so
// bumping the package version (semantic-release does this automatically on
// `main`) is enough to invalidate old service-worker caches on the next
// build — no separate manual constant to remember to bump.
const fs = require('fs');
const path = require('path');

const { version, iconVersion } = require('../package.json');

const swPath = path.join(__dirname, '..', 'public', 'sw.js');
const sw = fs.readFileSync(swPath, 'utf8');

const updated = sw.replace(
  /const CACHE_NAME = '[^']*';/,
  `const CACHE_NAME = 'msb-shell-v${version}';`
);

fs.writeFileSync(swPath, updated);

// Published alongside the app so open/installed copies can poll it (no-store,
// bypassing the service worker) and notice they're outdated — see
// src/hooks/useUpdateCheck.ts. `iconVersion` (package.json) is bumped by hand
// when the app icon artwork changes: installed home-screen icons never
// refresh themselves on iOS, so users must be told to re-add the app.
fs.writeFileSync(
  path.join(__dirname, '..', 'public', 'version.json'),
  `${JSON.stringify({ version, iconVersion: String(iconVersion) })}\n`
);
