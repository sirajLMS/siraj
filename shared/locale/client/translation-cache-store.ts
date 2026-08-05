import type { AppLocale } from "@/shared/locale/AppLocale";
import { getNamespaceConfig } from "@/shared/locale/client/namespace-registry";
import { readSnapshot, wipeIfBuildIdChanged, writeSnapshot } from "@/shared/locale/client/snapshot-cache";
import { getNamespaceId, type NamespaceHandle } from "@/shared/locale/namespaces/define-namespace";

interface CacheEntry<TLabels> {
  readonly promise: Promise<TLabels>;
  value?: TLabels;
}

type LocaleCache = Map<AppLocale, CacheEntry<unknown>>;
type HandleCache = Map<NamespaceHandle<unknown>, LocaleCache>;

const translationCache: HandleCache = new Map();

const useSnapshotFallback =
  typeof globalThis.window !== "undefined" && !globalThis.window?.isSecureContext && "indexedDB" in globalThis.window;

let hasWipedBuildId = false;

function checkBuildIdWipe(): void {
  if (useSnapshotFallback && !hasWipedBuildId) {
    hasWipedBuildId = true;
    wipeIfBuildIdChanged(process.env.NEXT_PUBLIC_BUILD_ID ?? "").catch(() => {});
  }
}

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

  checkBuildIdWipe();

  const localeCache = getLocaleCache(handle);
  const existing = localeCache.get(locale) as CacheEntry<TLabels> | undefined;
  if (existing) {
    return existing;
  }

  const namespaceId = getNamespaceId(handle);
  const entryHolder: { entry?: CacheEntry<TLabels> } = {};

  const loadPromise = (async (): Promise<TLabels> => {
    if (useSnapshotFallback && namespaceId) {
      try {
        const cached = await readSnapshot<TLabels>(namespaceId, locale);
        if (cached) {
          if (entryHolder.entry) {
            entryHolder.entry.value = cached;
          }
          return cached;
        }
      } catch {
        // Fall through to loader
      }
    }

    const labels = await config.load[locale]();
    if (entryHolder.entry) {
      entryHolder.entry.value = labels;
    }

    if (useSnapshotFallback && namespaceId) {
      writeSnapshot(namespaceId, locale, labels).catch(() => {});
    }

    return labels;
  })();

  const entry: CacheEntry<TLabels> = {
    promise: loadPromise,
  };
  entryHolder.entry = entry;

  localeCache.set(locale, entry);
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
