/**
 * Entity cache hit/miss statistics — extracted into a dedicated module to
 * break a circular dependency:
 *
 *   BaseRedisAdapter → EntityCacheService → CacheServiceFactory
 *   → PostgresCacheAdapter → CacheAdapterBase → EntityCacheService (cycle)
 *
 * The stats helpers have no dependency on `cacheService`, so isolating them
 * lets modules that only need `getEntityCacheStats` (e.g. `BaseRedisAdapter`,
 * `CacheAdapterBase`) import this file instead of the full `EntityCacheService`.
 */

/** Maximum number of tracked prefix entries (safety net against unbounded growth). */
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

/** Delete oldest entries when the map exceeds the cap. */
function enforceHitMissCap(): void {
  const excess = hitMissMap.size - MAX_HIT_MISS_ENTRIES;
  if (excess > 0) {
    for (const key of hitMissMap.keys()) {
      hitMissMap.delete(key);
      if (hitMissMap.size <= MAX_HIT_MISS_ENTRIES) break;
    }
  }
}

export function recordHit(prefix: string): void {
  const current = hitMissMap.get(prefix) ?? { hits: 0, misses: 0 };
  hitMissMap.set(prefix, { hits: current.hits + 1, misses: current.misses });
  enforceHitMissCap();
}

export function recordMiss(prefix: string): void {
  const current = hitMissMap.get(prefix) ?? { hits: 0, misses: 0 };
  hitMissMap.set(prefix, { hits: current.hits, misses: current.misses + 1 });
  enforceHitMissCap();
}

export function getEntityCacheStats(): Record<string, { hits: number; misses: number }> {
  return Object.fromEntries(hitMissMap);
}

export { prefixOf };
