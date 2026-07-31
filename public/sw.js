// Money Spending Board service worker.
// Bump CACHE_NAME whenever the precached shell list below changes so
// `activate` clears out the stale cache from a previous version.
const CACHE_NAME = 'msb-shell-v1';

const SHELL_URLS = [
  '/',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/offline.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    // Cross-origin requests (notably Supabase API calls) are never
    // intercepted or cached — always go straight to the network.
    return;
  }

  if (request.mode === 'navigate') {
    // `cache: 'no-store'` (and fetching the URL rather than the original
    // Request) ensures a truly offline network fails here instead of
    // silently resolving from the browser's HTTP disk cache.
    event.respondWith(
      fetch(request.url, { cache: 'no-store' }).catch(() =>
        caches.match('/offline.html'),
      ),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached ?? fetch(request)),
  );
});
