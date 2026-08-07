/**
 * DB-first / env-fallback resolver for environment configuration overrides.
 *
 * Resolution order per key (first hit wins):
 *  1. If the key is registered in `ENV_CONFIG_KEYS` with `excludeFromDb === true`, the resolver
 *     NEVER touches the DB and NEVER caches — it returns `process.env[key]` directly. This is
 *     a hard contract for keys whose values must always reflect the live process environment
 *     (e.g. secrets managers that rotate values, or keys that are illegal to persist in DB).
 *  2. Otherwise, the resolver looks up the DB override in `system_settings` under the key
 *     `env::<KEY>` (e.g. `SMTP_HOST` is stored under `system_settings.key = "env::SMTP_HOST"`).
 *     The `env::` prefix is applied transparently inside this module; callers pass the bare
 *     env var name (e.g. `resolveEnvConfig("SMTP_HOST")`).
 *  3. If the DB override is a non-empty string, that value is returned (and cached per key
 *     with a TTL of 5 minutes by default).
 *  4. Otherwise, the resolver falls back to `process.env[key]`.
 *
 * Module-scoped singleton cache: a single in-memory `Map` shared by all callers in the module,
 * keyed by env var name. TTL is configurable via `ENV_CONFIG_CACHE_TTL_MS` (default 300_000 ms).
 *
 * This module is isomorphic-safe: it imports only from `@/backend/**` and never touches
 * `@/app/**` or `next/*` APIs.
 */

import { SystemSettingsRepository } from "@/backend/db/repo";
import type { EnvConfigKeyDescriptor } from "@/backend/lib/env-config-keys";
import { ENV_CONFIG_KEYS } from "@/backend/lib/env-config-keys";
import { logger } from "@/backend/lib/logger";

/** Prefix applied to env var names when reading/writing DB overrides in `system_settings`. */
const ENV_SETTING_KEY_PREFIX = "env::";

/** Default cache TTL: 5 minutes. Overridable via `ENV_CONFIG_CACHE_TTL_MS` env var. */
const DEFAULT_CACHE_TTL_MS = 300_000;

/**
 * Module-scoped singleton cache entry. Shared across all callers in the module (not per-instance)
 * so that invalidation via `invalidateEnvConfigCache` is globally observable.
 */
interface CacheEntry {
  value: string | undefined;
  expiresAt: number;
}

/** Module-scoped singleton cache (not per-instance). Keyed by bare env var name. */
const cache = new Map<string, CacheEntry>();

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
 * Lazily-built index of registered env config descriptors by their bare env var name.
 * Returns an empty map if `ENV_CONFIG_KEYS` is not registered (e.g. Stage 3a registry
 * shipped late / not imported yet) — in which case every key is treated as DB-eligible
 * (i.e. `excludeFromDb === false`), matching the documented resolution order.
 */
let descriptorIndex: Map<string, EnvConfigKeyDescriptor> | null = null;

function getDescriptorIndex(): Map<string, EnvConfigKeyDescriptor> {
  if (descriptorIndex !== null) {
    return descriptorIndex;
  }
  const index = new Map<string, EnvConfigKeyDescriptor>();
  if (Array.isArray(ENV_CONFIG_KEYS)) {
    for (const descriptor of ENV_CONFIG_KEYS) {
      if (descriptor && typeof descriptor.key === "string") {
        index.set(descriptor.key, descriptor);
      }
    }
  }
  descriptorIndex = index;
  return descriptorIndex;
}

/**
 * Returns the DB storage key for an env var name, applying the `env::` prefix transparently.
 */
function toDbKey(envKey: string): string {
  return `${ENV_SETTING_KEY_PREFIX}${envKey}`;
}

/**
 * Returns true if the key is registered with `excludeFromDb === true`.
 *
 * Keys flagged `excludeFromDb` bypass both the DB lookup AND the cache — they are always
 * read fresh from `process.env`. This contract is enforced here, not at the call site.
 */
function isExcludedFromDb(envKey: string): boolean {
  return getDescriptorIndex().get(envKey)?.excludeFromDb === true;
}

/**
 * Reads a single env var name from `process.env` without ever touching the DB or cache.
 * Used for `excludeFromDb` keys and as the final fallback after a DB miss.
 */
function readFromProcessEnv(envKey: string): string | undefined {
  const value = process.env[envKey];
  return value === "" ? undefined : value;
}

/**
 * Resolves a single environment configuration key using the DB-first / env-fallback strategy.
 *
 * - For keys flagged `excludeFromDb: true` in `ENV_CONFIG_KEYS`: returns `process.env[key]`
 *   directly, never touching the DB and never caching. Fresh value on every call.
 * - For all other keys: checks the module-scoped TTL cache; on a hit, returns the cached
 *   value. On a miss, queries `system_settings` for `env::<key>`; if a non-empty string is
 *   found, that is returned and cached. Otherwise, falls back to `process.env[key]` (also
 *   cached, so repeated calls within the TTL do not re-query the DB).
 *
 * Secret values are NEVER logged — only the key name appears in log lines.
 *
 * @param key Bare env var name (e.g. `"SMTP_HOST"`), without the `env::` prefix.
 * @returns The resolved string value, or `undefined` if neither DB nor env provides one.
 */
export async function resolveEnvConfig(key: string): Promise<string | undefined> {
  if (!key) {
    return undefined;
  }

  // Hard contract: excludeFromDb keys bypass DB + cache entirely.
  if (isExcludedFromDb(key)) {
    logger.debug(`env-config: excluded key "${key}" read from process.env (no DB, no cache)`);
    return readFromProcessEnv(key);
  }

  const now = Date.now();
  const cachedEntry = cache.get(key);
  if (cachedEntry && cachedEntry.expiresAt > now) {
    logger.debug(`env-config: cache hit for key "${key}"`);
    return cachedEntry.value;
  }

  logger.debug(`env-config: cache miss for key "${key}", querying system_settings`);
  let dbValue: string | undefined;
  try {
    const setting = await SystemSettingsRepository.getByKey(toDbKey(key));
    if (setting?.value != null && setting.value !== "") {
      dbValue = setting.value;
    }
  } catch (error) {
    // Never let a DB error take down env resolution — fall back to process.env.
    logger.warn(
      `env-config: DB lookup failed for key "${key}", falling back to process.env. Error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  if (dbValue === undefined) {
    logger.debug(`env-config: DB miss for key "${key}", falling back to process.env`);
  }

  const resolved = dbValue ?? readFromProcessEnv(key);
  cache.set(key, { value: resolved, expiresAt: now + getCacheTtlMs() });
  return resolved;
}

/**
 * Splits `keys` into `excludeFromDb` keys (resolved directly from `process.env` into `result`
 * with no DB round-trip and no caching) and DB-eligible keys (returned for batched lookup).
 * Factored out of the batch function to keep its cognitive complexity under the SonarJS limit.
 */
function partitionKeysByDbEligibility(keys: string[], result: Record<string, string | undefined>): string[] {
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
 * Serves DB-eligible keys from the in-memory cache where fresh, writing hits into `result`,
 * and returns the list of keys that still require a DB round-trip. Factored out of the batch
 * function to keep cognitive complexity under the SonarJS limit.
 */
function serveFromCache(dbEligibleKeys: string[], result: Record<string, string | undefined>, now: number): string[] {
  const missesNeedingDb: string[] = [];
  for (const key of dbEligibleKeys) {
    const cachedEntry = cache.get(key);
    if (cachedEntry && cachedEntry.expiresAt > now) {
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
 * returning `undefined` so callers can fall back to `process.env`. Factored out to keep the
 * batch function's cognitive complexity under the SonarJS limit.
 *
 * @returns `[key, dbValue]` where `dbValue` is the non-empty DB override, or `undefined`
 *          on miss / error.
 */
async function lookupDbValueFor(key: string): Promise<readonly [string, string | undefined]> {
  try {
    const setting = await SystemSettingsRepository.getByKey(toDbKey(key));
    if (setting?.value != null && setting.value !== "") {
      return [key, setting.value] as const;
    }
  } catch (error) {
    logger.warn(
      `env-config: DB lookup failed for key "${key}", falling back to process.env. Error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
  return [key, undefined] as const;
}

/**
 * Records the resolved value for one DB-eligible key in both the cache and the result map.
 * Factored out of the batch function to keep cognitive complexity under the SonarJS limit.
 */
function recordResolvedKey(
  key: string,
  dbValue: string | undefined,
  result: Record<string, string | undefined>,
  now: number,
  ttlMs: number
): void {
  if (dbValue === undefined) {
    logger.debug(`env-config: DB miss for key "${key}", falling back to process.env`);
  }
  const resolved = dbValue ?? readFromProcessEnv(key);
  cache.set(key, { value: resolved, expiresAt: now + ttlMs });
  result[key] = resolved;
}

/**
 * Resolves many environment configuration keys in a single batch.
 *
 * `excludeFromDb` keys are resolved directly from `process.env` without a DB round-trip and
 * without caching. All remaining (DB-eligible) keys are fetched concurrently (one
 * `SystemSettingsRepository.getByKey` call each, since the repository does not yet expose a
 * batched `getMany` accessor — see CROSS-FILE note in the module TSDoc) and cached
 * individually with the same TTL as `resolveEnvConfig`.
 *
 * The returned record is keyed by the bare env var name (no `env::` prefix) and contains an
 * entry for every requested key, even if the resolved value is `undefined`.
 *
 * @param keys Bare env var names, without the `env::` prefix.
 * @returns Record<envKey, resolvedValue | undefined> — one entry per requested key.
 */
export async function resolveEnvConfigMany(keys: string[]): Promise<Record<string, string | undefined>> {
  const result: Record<string, string | undefined> = {};
  if (keys.length === 0) {
    return result;
  }

  const dbEligibleKeys = partitionKeysByDbEligibility(keys, result);
  if (dbEligibleKeys.length === 0) {
    return result;
  }

  const now = Date.now();
  const ttlMs = getCacheTtlMs();
  const missesNeedingDb = serveFromCache(dbEligibleKeys, result, now);
  if (missesNeedingDb.length === 0) {
    return result;
  }

  // Batch lookups concurrently. NOTE: the repository exposes only single-key `getByKey`.
  // A single round-trip `getMany(keys)` accessor on the repo would reduce N queries to 1;
  // see CROSS-FILE note in the module-level TSDoc. We avoid mutating the repo here.
  const lookupResults = await Promise.all(missesNeedingDb.map(key => lookupDbValueFor(key)));
  for (const [key, dbValue] of lookupResults) {
    recordResolvedKey(key, dbValue, result, now, ttlMs);
  }

  return result;
}

/**
 * Invalidates the env-config cache.
 *
 * - If `key` is omitted, clears the entire module-scoped cache so every subsequent call must
 *   re-query the DB (or re-read `process.env`).
 * - If `key` is provided, drops only that key's cache entry. The next call for that key will
 *   perform a fresh DB / env lookup.
 *
 * Has no effect on `excludeFromDb` keys — those are never cached to begin with.
 *
 * @param key Optional bare env var name to invalidate. If omitted, clears the whole cache.
 */
export function invalidateEnvConfigCache(key?: string): void {
  if (key === undefined) {
    const size = cache.size;
    cache.clear();
    if (size > 0) {
      logger.debug(`env-config: invalidated entire cache (${size} entries)`);
    }
    return;
  }
  if (cache.delete(key)) {
    logger.debug(`env-config: invalidated cache entry for key "${key}"`);
  }
}

/**
 * Returns basic stats about the module-scoped env-config cache for observability and tests.
 *
 * NOTE: this reports the live cache contents regardless of per-entry expiry. Entries that
 * have passed their TTL will still appear in `size` / `keys` until they are evicted by the
 * next lookup (lazy TTL). This matches the documented lazy-expiry cache model and keeps the
 * stats accessor side-effect-free.
 *
 * @returns `{ size, keys }` where `size` is the current entry count and `keys` lists them.
 */
export function getEnvConfigCacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: [...cache.keys()],
  };
}
