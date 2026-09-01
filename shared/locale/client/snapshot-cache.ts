import type { AppLocale } from "@/shared/locale/AppLocale";

const DB_NAME = "siraj-locale-snapshots";
const DB_VERSION = 1;
const STORE_NAME = "snapshots";
const FN_PROP = "__fn";

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
      req.addEventListener("upgradeneeded", () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "key" });
        }
      });
      req.addEventListener("success", () => resolve(req.result));
      req.addEventListener("error", () => resolve(null));
    } catch {
      resolve(null);
    }
  });

  return dbPromise;
}

function reviver(_key: string, val: unknown): unknown {
  // Security: forbid function resurrection from IndexedDB payloads.
  // A tampered IndexedDB (XSS, devtools, third-party script) could inject
  // arbitrary code via the __fn property. Functions must only ever live in
  // the in-memory compile-time namespace loaders, never in cache.
  // Returning undefined causes JSON.parse to omit the key, signaling a
  // poisoned snapshot that readSnapshot will reject.
  if (val && typeof val === "object" && FN_PROP in val) {
    return undefined;
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
        req.addEventListener("success", () => resolve(req.result));
        req.addEventListener("error", () => resolve(undefined));
      } catch {
        resolve(undefined);
      }
    });

    if (!result?.json) {
      stats.misses++;
      return undefined;
    }

    const labels: TLabels = JSON.parse(result.json, reviver);
    // Fail-closed: if the reviver detected any __fn payloads (returning undefined),
    // the parsed object will be missing function-typed labels. Discard the snapshot
    // and fall through to the compile-time namespace loader (config.load[locale]()).
    if (labels && typeof labels === "object" && Object.values(labels).some(v => v === undefined)) {
      stats.misses++;
      return undefined;
    }
    stats.hits++;
    return labels;
  } catch {
    stats.misses++;
    return undefined;
  }
}

export async function writeSnapshot(
  namespaceId: string,
  locale: AppLocale,
  labels: unknown,
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
        req.addEventListener("success", () => {
          stats.size++;
          resolve();
        });
        req.addEventListener("error", () => resolve());
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
        req.addEventListener("success", () => {
          const res = req.result;
          if (Array.isArray(res)) {
            const stringKeys: string[] = [];
            for (const item of res) {
              if (typeof item === "string") stringKeys.push(item);
            }
            resolve(stringKeys);
          } else {
            resolve([]);
          }
        });
        req.addEventListener("error", () => resolve([]));
      } catch {
        resolve([]);
      }
    });

    const hasDifferentBuildId = keys.some(k => !k.startsWith(`${buildId}:`));
    if (!hasDifferentBuildId) return false;

    await new Promise<void>(resolve => {
      try {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.clear();
        req.addEventListener("success", () => resolve());
        req.addEventListener("error", () => resolve());
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
