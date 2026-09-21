const CACHE_NAME = 'helix-os-v5.1';
const PRE_CACHED_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRE_CACHED_ASSETS).catch(err => console.warn('PWA Precache error:', err)))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  // Bypass service worker entirely for API requests, Vite dev modules, v86 assets, and Range-header requests.
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/@') ||
    url.pathname.includes('vite') ||
    url.pathname.includes('/v86/') ||
    event.request.headers.has('range') ||
    (url.protocol !== 'http:' && url.protocol !== 'https:')
  ) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(() => {
        // Offline fallback logic here if needed
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      });
    })
  );
});
