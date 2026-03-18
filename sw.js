const CACHE = 'finance-v2';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      cache.addAll([
        './finance-tracker.html',
        './manifest.json',
        './icon-192.png',
        './icon-512.png'
      ])
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  if (url.includes('api.github.com')) {
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response('{"error":"offline"}', { headers: { 'Content-Type': 'application/json' } })
      )
    );
    return;
  }

  if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    e.respondWith(
      caches.open(CACHE).then(cache =>
        fetch(e.request).then(response => {
          cache.put(e.request, response.clone());
          return response;
        }).catch(() => cache.match(e.request))
      )
    );
    return;
  }

  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(e.request).then(cached => {
        const fetchPromise = fetch(e.request).then(response => {
          if (response && response.status === 200) {
            cache.put(e.request, response.clone());
          }
          return response;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    )
  );
});
