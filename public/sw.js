// Service worker de Reps: permite abrir la app sin conexión.
// - La página se pide primero a la red (para recibir versiones nuevas) y, sin conexión, se usa la copia guardada.
// - Los archivos de la app (JS, CSS, iconos) y las fuentes se sirven desde la copia y se actualizan en segundo plano.
const CACHE = 'reps-v1';
const FONTS = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // Guarda la página y todo lo que enlaza (los nombres de los archivos cambian en cada versión).
      const res = await fetch('./', { cache: 'no-cache' });
      const html = await res.clone().text();
      await cache.put('./', res);
      const links = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
      const assets = [...links, 'manifest.webmanifest', 'icons/icon-192.png']
        .map((href) => new URL(href, self.registration.scope))
        .filter((u) => u.origin === self.location.origin)
        .map((u) => u.href);
      // Sin repetidos: addAll falla si una dirección aparece dos veces.
      await cache.addAll([...new Set(assets)]);
    })(),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        try {
          const res = await fetch(request);
          if (res.ok) await cache.put('./', res.clone());
          return res;
        } catch {
          return (await cache.match('./')) || Response.error();
        }
      })(),
    );
    return;
  }

  if (url.origin === self.location.origin || FONTS.includes(url.origin)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((res) => {
            if (res.ok || res.type === 'opaque') cache.put(request, res.clone());
            return res;
          })
          .catch(() => undefined);
        if (cached) {
          event.waitUntil(network);
          return cached;
        }
        return (await network) || Response.error();
      })(),
    );
  }
});
