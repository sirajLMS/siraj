const SW_URL = new URL(self.location.href);
const BUILD_ID = SW_URL.searchParams.get("build") || "unknown";

const STATIC_CACHE_PREFIX = "siraj-static-chunks-";
const API_CACHE_PREFIX = "siraj-api-";

const STATIC_CACHE_NAME = `${STATIC_CACHE_PREFIX}${BUILD_ID}`;
const API_CACHE_NAME = `${API_CACHE_PREFIX}${BUILD_ID}`;

const ACTIVE_CACHE_NAMES = new Set([STATIC_CACHE_NAME, API_CACHE_NAME]);
const KNOWN_CACHE_PREFIXES = [STATIC_CACHE_PREFIX, API_CACHE_PREFIX];

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
          if (KNOWN_CACHE_PREFIXES.some((prefix) => key.startsWith(prefix)) && !ACTIVE_CACHE_NAMES.has(key)) {
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

  const isApiGetRequest = url.origin === self.location.origin && url.pathname.startsWith("/api/");

  if (isNextStaticChunk) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE_NAME);
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
    return;
  }

  if (!isApiGetRequest) return;

  // API responses are network-first to avoid stale data after deploys.
  event.respondWith(
    (async () => {
      const cache = await caches.open(API_CACHE_NAME);
      const cachedResponse = await cache.match(request);

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
