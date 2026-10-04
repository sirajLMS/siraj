import { SystemSettingsRepository } from "@/backend/db/repo/shared";
import { isTransientError } from "@/backend/lib";
import { ENV_CONFIG_KEYS } from "@/backend/lib/env-config-keys";
import { logger } from "@/backend/lib/logger";
import {
  decryptDbOverrideIfSecret,
  isExcludedFromDb,
  readFromProcessEnv,
  toEnvSettingDbKey,
} from "@/backend/services/system/environment-config.helpers";

// ─── Cache infrastructure (module-scoped singleton) ────────────────────────────

/** Default cache TTL: 5 minutes. Overridable via `ENV_CONFIG_CACHE_TTL_MS` env var. */
const DEFAULT_CACHE_TTL_MS = 300_000;

/** Short cache TTL for transient DB failures — re-query DB sooner. */
const SHORT_CACHE_TTL_MS = 30_000;

/**
 * Module-scoped singleton cache entry. Shared across all callers in the module (not
 * per-instance) so that invalidation via `invalidateEnvConfigCache` is globally observable.
 */
interface CacheEntry {
  value: string | undefined;
  expiresAt: number;
  /**
   * `"env"` = pre-warmed from `process.env` (non-authoritative — DB override may exist).
   * `"db"` = resolved via DB lookup (authoritative — correct precedence confirmed).
   */
  source: "env" | "db";
  /**
   * `true` when the DB lookup failed with a transient error (e.g. cold-start).
   * Transient `"env"` entries short-circuit during the short TTL window to
   * throttle re-queries against a failing DB.
   */
  transientError: boolean;
}

/** Module-scoped singleton cache (not per-instance). Keyed by bare env var name. */
const cache = new Map<string, CacheEntry>();

/**
 * Reads a fresh cache entry that is authoritative for precedence: a `"db"` entry
 * (correct precedence confirmed) or a transient-`"env"` entry within its short TTL
 * (throttled re-query). Pre-warmed non-transient `"env"` entries are non-authoritative
 * and report `hit: false` so the caller re-queries the DB.
 */
export function readCachedResolvedValue(key: string, now: number): { hit: boolean; value: string | undefined } {
  const entry = cache.get(key);
  if (entry && entry.expiresAt > now && (entry.source === "db" || (entry.source === "env" && entry.transientError))) {
    logger.debug(`env-config: cache hit for key "${key}"`);
    return { hit: true, value: entry.value };
  }
  return { hit: false, value: undefined };
}

/** Clears the whole cache and returns the number of evicted entries. */
export function clearEnvConfigCache(): number {
  const size = cache.size;
  cache.clear();
  return size;
}

/** Drops one cache entry; returns whether an entry was removed. */
export function deleteEnvConfigCacheEntry(key: string): boolean {
  return cache.delete(key);
}

/**
 * Reads the configured cache TTL from the environment. Evaluated lazily so that test
 * suites or boot scripts can set `ENV_CONFIG_CACHE_TTL_MS` before the first lookup.
 */
function getCacheTtlMs(): number {
  const raw = process.env.ENV_CONFIG_CACHE_TTL_MS;
  if (!raw) {
    return DEFAULT_CACHE_TTL_MS;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_CACHE_TTL_MS;
}

/**
 * Commits a DB-resolved value to the cache, reusing any pre-warmed "env" cache value
 * when the DB misses (avoids redundant `process.env` read).
 *
 * `source` controls authoritative tagging: `"db"` — DB lookup succeeded (hit or
 * miss), authoritative; `"env"` — DB lookup failed, non-authoritative.
 */
export function commitDbResolvedValue(
  key: string,
  dbValue: string | undefined,
  now: number,
  ttlMs: number,
  source: "db" | "env",
  transientError: boolean = false
): string | undefined {
  if (dbValue === undefined && source === "db") {
    logger.debug(`env-config: DB miss for key "${key}", falling back to process.env`);
  }
  const existingEntry = cache.get(key);
  const cachedEnvValue = existingEntry?.source === "env" ? existingEntry.value : undefined;
  const resolved = dbValue ?? cachedEnvValue ?? readFromProcessEnv(key);
  cache.set(key, { value: resolved, expiresAt: now + ttlMs, source, transientError });
  return resolved;
}

/**
 * Performs a single-key DB lookup for env config, swallowing errors and returning
 * `undefined` on failure.
 */
export async function performDbLookup(
  key: string
): Promise<{ dbValue: string | undefined; dbError: boolean; wasTransient: boolean }> {
  try {
    const setting = await SystemSettingsRepository.getByKey(toEnvSettingDbKey(key));
    if (setting?.value != null && setting.value !== "") {
      return { dbValue: decryptDbOverrideIfSecret(key, setting.value), dbError: false, wasTransient: false };
    }
    return { dbValue: undefined, dbError: false, wasTransient: false };
  } catch (error) {
    const transient = isTransientError(error);
    if (transient) {
      logger.warn(
        `env-config: DB lookup failed (transient) for key "${key}", using short cache TTL (${SHORT_CACHE_TTL_MS}ms) to retry sooner. Error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } else {
      logger.error(
        `env-config: DB lookup failed (non-transient) for key "${key}". Error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
    return { dbValue: undefined, dbError: true, wasTransient: transient };
  }
}

/**
 * Resolves the cache TTL based on DB lookup outcome. Transient errors get a shorter
 * TTL so the DB is re-queried sooner.
 */
export function resolveTtl(dbError: boolean, wasTransient: boolean): number {
  if (dbError && wasTransient) {
    return SHORT_CACHE_TTL_MS;
  }
  return getCacheTtlMs();
}

/**
 * Splits `keys` into `excludeFromDb` keys (resolved directly from `process.env` into
 * `result` with no DB round-trip and no caching) and DB-eligible keys (returned for
 * batched lookup).
 */
export function partitionKeysByDbEligibility(keys: string[], result: Record<string, string | undefined>): string[] {
  const dbEligibleKeys: string[] = [];
  for (const key of keys) {
    if (!key) {
      continue;
    }
    if (isExcludedFromDb(key)) {
      logger.debug(`env-config: excluded key "${key}" read from process.env (no DB, no cache)`);
      result[key] = readFromProcessEnv(key);
    } else {
      dbEligibleKeys.push(key);
    }
  }
  return dbEligibleKeys;
}

/**
 * Serves DB-eligible keys from the in-memory cache where fresh, writing hits into
 * `result`, and returns the list of keys that still require a DB round-trip.
 */
export function serveFromCache(
  dbEligibleKeys: string[],
  result: Record<string, string | undefined>,
  now: number
): string[] {
  const missesNeedingDb: string[] = [];
  for (const key of dbEligibleKeys) {
    const cachedEntry = cache.get(key);
    // Short-circuit on "db" entries (authoritative) or transient-"env" entries
    // (throttled re-query within short TTL). Pre-warmed non-transient "env" entries
    // always fall through to DB lookup (non-authoritative).
    if (
      cachedEntry &&
      cachedEntry.expiresAt > now &&
      (cachedEntry.source === "db" || (cachedEntry.source === "env" && cachedEntry.transientError))
    ) {
      logger.debug(`env-config: cache hit for key "${key}"`);
      result[key] = cachedEntry.value;
    } else {
      missesNeedingDb.push(key);
    }
  }
  return missesNeedingDb;
}

/**
 * Performs a single-key DB lookup for one DB-eligible env var, swallowing DB errors and
 * returning `undefined` so callers can fall back to `process.env`.
 *
 * @returns `[key, dbValue, dbError, wasTransient]` where `dbValue` is the non-empty DB
 *          override, or `undefined` on miss / error.
 */
export async function lookupDbValueFor(key: string): Promise<readonly [string, string | undefined, boolean, boolean]> {
  try {
    const setting = await SystemSettingsRepository.getByKey(toEnvSettingDbKey(key));
    if (setting?.value != null && setting.value !== "") {
      return [key, decryptDbOverrideIfSecret(key, setting.value), false, false] as const;
    }
  } catch (error) {
    const transient = isTransientError(error);
    if (transient) {
      logger.warn(
        `env-config: DB lookup failed (transient) for key "${key}", using short cache TTL. Error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } else {
      logger.error(
        `env-config: DB lookup failed (non-transient) for key "${key}". Error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
    return [key, undefined, true, transient] as const;
  }
  return [key, undefined, false, false] as const;
}

/**
 * Records the resolved value for one DB-eligible key in both the cache and the result map.
 */
export function recordResolvedKey(
  key: string,
  dbValue: string | undefined,
  result: Record<string, string | undefined>,
  now: number,
  ttlMs: number,
  source: "db" | "env",
  transientError: boolean = false
): void {
  const resolved = commitDbResolvedValue(key, dbValue, now, ttlMs, source, transientError);
  result[key] = resolved;
}

/**
 * Pre-warms the env-config cache with `process.env` values for every DB-eligible
 * env-config key (`excludeFromDb === false`) at module load. Excluded keys bypass both
 * the DB and the cache by hard contract, so they are never cached.
 */
export function preWarmEnvConfigCacheImpl(): void {
  const now = Date.now();
  const ttlMs = getCacheTtlMs();
  for (const descriptor of ENV_CONFIG_KEYS) {
    if (descriptor.excludeFromDb) {
      continue;
    }
    const envValue = readFromProcessEnv(descriptor.key);
    if (envValue === undefined) {
      continue;
    }
    cache.set(descriptor.key, { value: envValue, expiresAt: now + ttlMs, source: "env", transientError: false });
  }
  logger.debug(`env-config: pre-warmed cache with ${cache.size} entries from process.env`);
}
