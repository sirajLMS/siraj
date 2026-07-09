import createCache from "@emotion/cache";

let ltrEmotionCache: ReturnType<typeof createCache> | undefined;

/** Shared Emotion cache without the RTL stylis plugin — for LTR islands on RTL pages. */
export function getLtrEmotionCache(): ReturnType<typeof createCache> {
  ltrEmotionCache ??= (() => {
    const cache = createCache({ key: "mui-ltr", prepend: true });
    cache.compat = true;
    return cache;
  })();

  return ltrEmotionCache;
}
