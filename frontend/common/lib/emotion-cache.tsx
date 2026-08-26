"use client";

import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { useServerInsertedHTML } from "next/navigation";
import { useMemo, type ReactNode } from "react";
import rtlPlugin from "stylis-plugin-rtl";
import { useAppLocale } from "@/frontend/common/providers/localeContext";

interface EmotionCacheProviderProps {
  readonly children: ReactNode;
  readonly nonce?: string;
}

// stylis-plugin-rtl can be exported as default or CJS module depending on bundler
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const resolvedRtlPlugin = (typeof rtlPlugin === "function" ? rtlPlugin : (rtlPlugin as any)?.default) ?? rtlPlugin;

function createLtrCache(nonce?: string) {
  const cache = createCache({ key: "ltr", prepend: true, nonce });
  cache.compat = true;
  return cache;
}

function createRtlCache(nonce?: string) {
  // Skip stylis `prefixer`: it crashes on `::placeholder` when mixed with Emotion's
  // nested stylis copy (Cannot read properties of undefined (reading 'push')).
  const cache = createCache({
    key: "rtl",
    prepend: true,
    nonce,
    stylisPlugins: [resolvedRtlPlugin],
  });
  cache.compat = true;
  return cache;
}

export default function EmotionCacheProvider({ children, nonce }: EmotionCacheProviderProps) {
  const locale = useAppLocale();
  const isRtl = locale === "ar";
  const cache = useMemo(() => (isRtl ? createRtlCache(nonce) : createLtrCache(nonce)), [isRtl, nonce]);

  useServerInsertedHTML(() => {
    const names = Object.keys(cache.inserted);
    if (names.length === 0) {
      return null;
    }
    const styles = Object.values(cache.inserted).join(" ");
    return (
      <style
        data-emotion={`${cache.key} ${names.join(" ")}`}
        nonce={nonce ?? undefined}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Emotion requires this for SSR style injection
        dangerouslySetInnerHTML={{
          __html: styles,
        }}
      />
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
