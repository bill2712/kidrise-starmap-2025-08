// Basic Service Worker to pass PWA install criteria
const CACHE_NAME = 'barista-flow-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through fetch (no offline caching yet, just enough to trigger PWA prompt)
  event.respondWith(fetch(event.request));
});
