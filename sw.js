// Inventario Dental: guarda la app completa en el dispositivo para que abra sin internet.
const CACHE = 'inventario-dental-v3-1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './jspdf.umd.min.js',
  './fflate.min.js',
  './pdf.min.js',
  './pdf.worker.min.js',
  './figtree.css',
  './figtree-latin-wght-normal.woff2',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // La página: primero internet (para recibir mejoras); sin conexión, la copia guardada.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put('./index.html', copy));
          }
          return res;
        })
        .catch(() => caches.match('./index.html').then((m) => m || caches.match('./')))
    );
    return;
  }

  // Archivos: primero la copia guardada.
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((m) => m || fetch(req).then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }))
  );
});
