import type { AppLocale } from "@/shared/locale/AppLocale";
import { getBetaNamespaceConfig } from "@/shared/locale/beta/beta-namespace-registry";
import type { BetaNamespaceHandle } from "@/shared/locale/beta/define-beta-namespace";

interface CacheEntry<TLabels> {
  readonly promise: Promise<TLabels>;
  value?: TLabels;
}

type LocaleCache = Map<AppLocale, CacheEntry<unknown>>;
type HandleCache = Map<BetaNamespaceHandle<unknown>, LocaleCache>;

const betaTranslationCache: HandleCache = new Map();

function getLocaleCache(handle: BetaNamespaceHandle<unknown>): LocaleCache {
  let localeCache = betaTranslationCache.get(handle);
  if (!localeCache) {
    localeCache = new Map();
    betaTranslationCache.set(handle, localeCache);
  }
  return localeCache;
}

function startBetaNamespaceLoad<TLabels>(handle: BetaNamespaceHandle<TLabels>, locale: AppLocale): CacheEntry<TLabels> {
  const config = getBetaNamespaceConfig(handle);
  if (!config) {
    throw new Error("Unknown beta namespace handle");
  }

  const localeCache = getLocaleCache(handle as BetaNamespaceHandle<unknown>);
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

export function ensureBetaNamespaceLoading<TLabels>(handle: BetaNamespaceHandle<TLabels>, locale: AppLocale): void {
  startBetaNamespaceLoad(handle, locale);
}

export function readBetaTranslation<TLabels>(handle: BetaNamespaceHandle<TLabels>, locale: AppLocale): TLabels {
  const entry = startBetaNamespaceLoad(handle, locale);
  if (entry.value === undefined) {
    throw entry.promise;
  }
  return entry.value;
}
