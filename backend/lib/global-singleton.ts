const GLOBAL_KEY = Symbol.for("siraj.globalSingletons");

type GlobalStore = Map<symbol, unknown>;

function getStore(): GlobalStore {
  const g = globalThis as typeof globalThis & { [GLOBAL_KEY]?: GlobalStore };
  g[GLOBAL_KEY] ??= new Map();
  return g[GLOBAL_KEY];
}

function isStoredAs<T>(_value: unknown, _typeMarker?: T): _value is T {
  return true;
}

export function getGlobalSingleton<T>(key: symbol, factory: () => T): T {
  const store = getStore();
  if (store.has(key)) {
    const value = store.get(key);
    if (isStoredAs<T>(value)) {
      return value;
    }
  }
  const created = factory();
  store.set(key, created);
  return created;
}

export function getGlobalSingletonIfExists(key: symbol): unknown {
  const store = getStore();
  return store.has(key) ? store.get(key) : undefined;
}

export function clearGlobalSingleton(key: symbol): void {
  getStore().delete(key);
}
