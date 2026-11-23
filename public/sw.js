const cachePrefix = 'watchmaker:' + self.registration.scope + ':';
const cacheName = cachePrefix + '5';
const appShell = [
  './index.html',
  './watchface-project.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './vendor/jszip.min.js',
];
const shellUrls = new Set(appShell.map(path => new URL(path, self.registration.scope).href));

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    await cache.addAll(appShell.map(path => new Request(path, { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter(name => name.startsWith(cachePrefix) && name !== cacheName)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    const url = new URL(request.url);
    const scope = new URL(self.registration.scope);
    const entry = new URL('./index.html', scope);
    if (url.origin !== scope.origin ||
        (url.pathname !== scope.pathname && url.pathname !== entry.pathname)) return;

    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok || response.status < 500) return response;
      } catch {
        // Open the cached editor when the connection is unavailable.
      }
      const cache = await caches.open(cacheName);
      return (await cache.match(entry)) || Response.error();
    })());
  } else if (shellUrls.has(request.url)) {
    event.respondWith((async () => {
      const cache = await caches.open(cacheName);
      return (await cache.match(request)) || fetch(request);
    })());
  }
});
