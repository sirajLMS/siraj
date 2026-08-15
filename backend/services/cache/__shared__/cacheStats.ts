/**
 * In-memory entity-cache hit/miss statistics tracking.
 *
 * Extracted from {@link EntityCacheService} into this standalone module to
 * break a circular dependency:
 *
 *   redis/BaseRedisAdapter → cache/EntityCacheService → cache/CacheServiceFactory
 *   → cache/RedisCacheAdapter → redis barrel → redis/RedisServiceFactory
 *   → redis/BaseRedisAdapter  (cycle)
 *
 * The stats counters have no dependency on `cacheService` or any Redis/adapter
 * module, so isolating them here lets both the Redis layer
 * (`BaseRedisAdapter.stats()`) and the cache layer (`CacheAdapterBase.stats()`)
 * read the counters without pulling in `EntityCacheService` (which transitively
 * imports the cache factory and Redis adapters).
 */

/**
 * Maximum number of entries allowed in hitMissMap.
 * Normal usage derives a finite set of prefixes via prefixOf(), so this cap
 * is a safety net — it prevents unbounded growth if keys with unexpected
 * prefixes are introduced. When the limit is exceeded, oldest entries are
 * evicted first.
 */
const MAX_HIT_MISS_ENTRIES = 100;

const hitMissMap = new Map<string, { hits: number; misses: number }>();

function prefixOf(key: string): string {
  if (key.startsWith("ec:")) {
    const rest = key.slice(3);
    if (rest.startsWith("parent:dash:metrics:")) return "parent:dash:metrics";
    if (rest.startsWith("supervisor:dash:")) return "supervisor:dash";
    if (rest.startsWith("parent:dir:")) return "parent:dir";
    if (rest.startsWith("teacher:dir:")) return "teacher:dir";
    if (rest.startsWith("teacher:byUserId:")) return "teacher:byUserId";
    if (rest.startsWith("parent:byUserId:")) return "parent:byUserId";
    const parts = rest.split(":");
    return parts[0] || "general";
  }
  if (key.startsWith("tag:")) {
    return "tag";
  }
  const parts = key.split(":");
  return parts[0] || "general";
}

/**
 * Enforce the MAX_HIT_MISS_ENTRIES cap by deleting oldest entries.
 * Map preserves insertion order, so we delete the first N excess entries.
 */
function enforceHitMissCap(): void {
  const excess = hitMissMap.size - MAX_HIT_MISS_ENTRIES;
  if (excess > 0) {
    for (const key of hitMissMap.keys()) {
      hitMissMap.delete(key);
      if (hitMissMap.size <= MAX_HIT_MISS_ENTRIES) break;
    }
  }
}

function recordHit(prefix: string): void {
  const current = hitMissMap.get(prefix) ?? { hits: 0, misses: 0 };
  hitMissMap.set(prefix, { hits: current.hits + 1, misses: current.misses });
  enforceHitMissCap();
}

function recordMiss(prefix: string): void {
  const current = hitMissMap.get(prefix) ?? { hits: 0, misses: 0 };
  hitMissMap.set(prefix, { hits: current.hits, misses: current.misses + 1 });
  enforceHitMissCap();
}

export function recordHitForKey(key: string): void {
  recordHit(prefixOf(key));
}

export function recordMissForKey(key: string): void {
  recordMiss(prefixOf(key));
}

export function getEntityCacheStats(): Record<string, { hits: number; misses: number }> {
  return Object.fromEntries(hitMissMap);
}
