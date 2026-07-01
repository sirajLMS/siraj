"use client";

import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { useServerInsertedHTML } from "next/navigation";
import { useLocale } from "next-intl";
import type { ReactNode } from "react";
import { prefixer } from "stylis";
import rtlPlugin from "stylis-plugin-rtl";

interface EmotionCacheProviderProps {
  readonly children: ReactNode;
  readonly nonce?: string;
}

function createLtrCache(nonce?: string) {
  const cache = createCache({ key: "ltr", prepend: true, nonce });
  cache.compat = true;
  return cache;
}

function createRtlCache(nonce?: string) {
  const cache = createCache({
    key: "rtl",
    prepend: true,
    nonce,
    stylisPlugins: [prefixer, rtlPlugin],
  });
  cache.compat = true;
  return cache;
}

export default function EmotionCacheProvider({ children, nonce }: EmotionCacheProviderProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const cache = isRtl ? createRtlCache(nonce) : createLtrCache(nonce);

  useServerInsertedHTML(() => {
    const names = Object.keys(cache.inserted);
    if (names.length === 0) {
      return null;
    }
    const styles = Object.values(cache.inserted).join(" ");
    return (
      <style
        data-emotion={`${cache.key} ${names.join(" ")}`}
        nonce={nonce || undefined}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Emotion requires this for SSR style injection
        dangerouslySetInnerHTML={{
          __html: styles,
        }}
      />
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
