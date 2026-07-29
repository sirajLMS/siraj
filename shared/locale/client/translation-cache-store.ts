import type { AppLocale } from "@/shared/locale/AppLocale";
import { getNamespaceConfig } from "@/shared/locale/client/namespace-registry";
import type { NamespaceHandle } from "@/shared/locale/namespaces/define-namespace";

interface CacheEntry<TLabels> {
  readonly promise: Promise<TLabels>;
  value?: TLabels;
}

type LocaleCache = Map<AppLocale, CacheEntry<unknown>>;
type HandleCache = Map<NamespaceHandle<unknown>, LocaleCache>;

const translationCache: HandleCache = new Map();

function getLocaleCache(handle: NamespaceHandle<unknown>): LocaleCache {
  let localeCache = translationCache.get(handle);
  if (!localeCache) {
    localeCache = new Map();
    translationCache.set(handle, localeCache);
  }
  return localeCache;
}

function startNamespaceLoad<TLabels>(handle: NamespaceHandle<TLabels>, locale: AppLocale): CacheEntry<TLabels> {
  const config = getNamespaceConfig(handle);
  if (!config) {
    throw new Error("Unknown namespace handle");
  }

  const localeCache = getLocaleCache(handle as NamespaceHandle<unknown>);
  const existing = localeCache.get(locale) as CacheEntry<TLabels> | undefined;
  if (existing) {
    return existing;
  }

  const entry: CacheEntry<TLabels> = {
    promise: config.load[locale]().then(labels => {
      entry.value = labels;
      return labels;
    }),
  };
  localeCache.set(locale, entry as CacheEntry<unknown>);
  return entry;
}

export function ensureNamespaceLoading<TLabels>(handle: NamespaceHandle<TLabels>, locale: AppLocale): void {
  startNamespaceLoad(handle, locale);
}

export function readTranslation<TLabels>(handle: NamespaceHandle<TLabels>, locale: AppLocale): TLabels {
  const entry = startNamespaceLoad(handle, locale);
  if (entry.value === undefined) {
    throw entry.promise;
  }
  return entry.value;
}
