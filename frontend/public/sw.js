const CACHE = 'sympra-offline-v1';
const SHELL = ['/', '/index.html'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => { if (event.request.method !== 'GET') return; event.respondWith(fetch(event.request).then(response => { const copy = response.clone(); caches.open(CACHE).then(c => c.put(event.request, copy)); return response; }).catch(() => caches.match(event.request))); });
