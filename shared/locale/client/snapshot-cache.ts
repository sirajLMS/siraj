import type { AppLocale } from "@/shared/locale/AppLocale";

const DB_NAME = "siraj-locale-snapshots";
const DB_VERSION = 1;
const STORE_NAME = "snapshots";

let hasLoggedFirstHit = false;
let hasLoggedBuildMismatch = false;

const stats = {
  hits: 0,
  misses: 0,
  size: 0,
};

let dbPromise: Promise<IDBDatabase | null> | null = null;

function getDb(): Promise<IDBDatabase | null> {
  // Prefer feature detection via the global object rather than typeof checks.
  if (!("indexedDB" in globalThis)) {
    return Promise.resolve(null);
  }

  // Use nullish coalescing assignment to initialize dbPromise only when it's nullish.
  dbPromise ??= new Promise(resolve => {
    try {
      const idb = globalThis.indexedDB;
      const req = idb.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "key" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });

  return dbPromise;
}

export function reviver(_key: string, val: unknown): unknown {
  if (val && typeof val === "object" && "__fn" in val && typeof val.__fn === "string") {
    try {
      const fnValue = val.__fn;
      // eslint-disable-next-line sonarjs/code-eval
      return new Function(`return (${fnValue})`)();
    } catch {
      return val;
    }
  }
  return val;
}

export async function readSnapshot<TLabels>(
  namespaceId: string,
  locale: AppLocale,
  buildId = process.env.NEXT_PUBLIC_BUILD_ID ?? ""
): Promise<TLabels | undefined> {
  try {
    const db = await getDb();
    if (!db) {
      stats.misses++;
      return undefined;
    }

    const key = `${buildId}:${namespaceId}:${locale}`;
    const result = await new Promise<{ key: string; json: string; ts: number } | undefined>(resolve => {
      try {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(undefined);
      } catch {
        resolve(undefined);
      }
    });

    if (!result?.json) {
      stats.misses++;
      return undefined;
    }

    const labels = JSON.parse(result.json, reviver) as TLabels;
    stats.hits++;
    if (!hasLoggedFirstHit) {
      hasLoggedFirstHit = true;
      if (typeof console !== "undefined") {
        // eslint-disable-next-line no-console
        console.info(`[locale-cache] IndexedDB snapshot hit for ${namespaceId}:${locale}`);
      }
    }
    return labels;
  } catch {
    stats.misses++;
    return undefined;
  }
}

export async function writeSnapshot<TLabels>(
  namespaceId: string,
  locale: AppLocale,
  labels: TLabels,
  buildId = process.env.NEXT_PUBLIC_BUILD_ID ?? ""
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    const key = `${buildId}:${namespaceId}:${locale}`;
    const json = JSON.stringify(labels);
    const item = { key, json, ts: Date.now() };

    await new Promise<void>(resolve => {
      try {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(item);
        req.onsuccess = () => {
          stats.size++;
          resolve();
        };
        req.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  } catch {
    // Silently fall through
  }
}

export async function wipeIfBuildIdChanged(buildId: string): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db || !buildId) return false;

    const keys = await new Promise<string[]>(resolve => {
      try {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAllKeys();
        req.onsuccess = () => resolve((req.result as string[]) ?? []);
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });

    const hasDifferentBuildId = keys.some(k => !k.startsWith(`${buildId}:`));
    if (!hasDifferentBuildId) return false;

    if (!hasLoggedBuildMismatch) {
      hasLoggedBuildMismatch = true;
      if (typeof console !== "undefined") {
        // eslint-disable-next-line no-console
        console.info(`[locale-cache] BUILD_ID mismatch detected. Wiping IndexedDB snapshot store.`);
      }
    }

    await new Promise<void>(resolve => {
      try {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      } catch {
        resolve();
      }
    });

    stats.size = 0;
    return true;
  } catch {
    return false;
  }
}

export function getLocaleCacheStats(): { hits: number; misses: number; size: number } {
  return { ...stats };
}
