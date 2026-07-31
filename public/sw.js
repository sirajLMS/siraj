const CACHE_NAME = "siraj-static-chunks-v1";
const CACHE_PREFIX = "siraj-static-chunks-";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME) {
            return caches.delete(key);
          }
          if (!key.startsWith(CACHE_PREFIX)) {
            return caches.delete(key);
          }
          return Promise.resolve(false);
        })
      );
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isNextStaticChunk =
    url.origin === self.location.origin &&
    url.pathname.startsWith("/_next/static/chunks/") &&
    url.pathname.endsWith(".js");

  if (!isNextStaticChunk) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(request);

      if (cachedResponse) {
        return cachedResponse;
      }

      try {
        const networkResponse = await fetch(request);
        if (networkResponse.status === 200) {
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        if (cachedResponse) {
          return cachedResponse;
        }
        throw error;
      }
    })()
  );
});
