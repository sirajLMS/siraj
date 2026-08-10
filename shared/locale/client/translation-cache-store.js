import { getNamespaceConfig } from "@/shared/locale/client/namespace-registry";
import { readSnapshot, wipeIfBuildIdChanged, writeSnapshot } from "@/shared/locale/client/snapshot-cache";
import { getNamespaceId } from "@/shared/locale/namespaces/define-namespace";

const translationCache = new Map();
const useSnapshotFallback =
  globalThis.window !== undefined && !globalThis.window?.isSecureContext && "indexedDB" in globalThis.window;
let hasWipedBuildId = false;
function checkBuildIdWipe() {
  if (useSnapshotFallback && !hasWipedBuildId) {
    hasWipedBuildId = true;
    wipeIfBuildIdChanged(process.env.NEXT_PUBLIC_BUILD_ID ?? "").catch(() => {});
  }
}
function getLocaleCache(handle) {
  let localeCache = translationCache.get(handle);
  if (!localeCache) {
    localeCache = new Map();
    translationCache.set(handle, localeCache);
  }
  return localeCache;
}
function startNamespaceLoad(handle, locale) {
  const config = getNamespaceConfig(handle);
  if (!config) {
    throw new Error("Unknown namespace handle");
  }
  checkBuildIdWipe();
  const localeCache = getLocaleCache(handle);
  const existing = localeCache.get(locale);
  if (existing) {
    return existing;
  }
  const namespaceId = getNamespaceId(handle);
  const entryHolder = {};
  const loadPromise = (async () => {
    if (useSnapshotFallback && namespaceId) {
      try {
        const cached = await readSnapshot(namespaceId, locale);
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
  const entry = {
    promise: loadPromise,
  };
  entryHolder.entry = entry;
  localeCache.set(locale, entry);
  return entry;
}
export function ensureNamespaceLoading(handle, locale) {
  startNamespaceLoad(handle, locale);
}
export function readTranslation(handle, locale) {
  const entry = startNamespaceLoad(handle, locale);
  if (entry.value === undefined) {
    throw entry.promise;
  }
  return entry.value;
}
