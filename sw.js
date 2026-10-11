/* KW Assistent — Service Worker.
   Beim Ausrollen einer neuen Version VERSION hochzählen (build.py setzt sie aus APP_VERSION). */
const VERSION = 'kw-assistent-v1.3.3';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION)
    .then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => null))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== VERSION).map((x) => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // Fremde Server (OpenStreetMap, Breitbandatlas) nie zwischenspeichern: Standortdaten bleiben flüchtig.
  if (new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((res) => { const c = res.clone(); caches.open(VERSION).then((x) => x.put('./index.html', c)); return res; })
      .catch(() => caches.match('./index.html').then((r) => r || caches.match('./'))));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
    if (res && res.status === 200 && res.type === 'basic') { const c = res.clone(); caches.open(VERSION).then((x) => x.put(req, c)); }
    return res;
  }).catch(() => hit)));
});
