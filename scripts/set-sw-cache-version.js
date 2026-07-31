// Keeps public/sw.js's CACHE_NAME in sync with package.json's version, so
// bumping the package version (semantic-release does this automatically on
// `main`) is enough to invalidate old service-worker caches on the next
// build — no separate manual constant to remember to bump.
const fs = require('fs');
const path = require('path');

const { version } = require('../package.json');

const swPath = path.join(__dirname, '..', 'public', 'sw.js');
const sw = fs.readFileSync(swPath, 'utf8');

const updated = sw.replace(
  /const CACHE_NAME = '[^']*';/,
  `const CACHE_NAME = 'msb-shell-v${version}';`
);

fs.writeFileSync(swPath, updated);
