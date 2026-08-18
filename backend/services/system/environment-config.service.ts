/**
 * Canonical environment-config service — read, write, and audit paths.
 *
 * This module consolidates the former `backend/lib/env-config-resolver.ts` (read path)
 * with the Settings → Environment Config tab service (write / delete / audit paths)
 * into a single source of truth.
 *
 * ── Read path (resolver) ──
 * Resolution order per key (first hit wins):
 *  1. If the key is registered in `ENV_CONFIG_KEYS` with `excludeFromDb === true`, the
 *     resolver NEVER touches the DB and NEVER caches — it returns `process.env[key]`
 *     directly. This is a hard contract for keys whose values must always reflect the
 *     live process environment (e.g. secrets managers that rotate values, or keys that
 *     are illegal to persist in DB).
 *  2. Otherwise, the resolver looks up the DB override in `system_settings` under the key
 *     `env::<KEY>`. The `env::` prefix is applied transparently; callers pass the bare
 *     env var name (e.g. `resolveEnvConfig("SMTP_HOST")`).
 *  3. If the DB override is a non-empty string, that value is returned (and cached per
 *     key with a TTL of 5 minutes by default).
 *  4. Otherwise, the resolver falls back to `process.env[key]`.
 *
 * Module-scoped singleton cache: a single in-memory `Map` shared by all callers in the
 * module, keyed by env var name. TTL is configurable via `ENV_CONFIG_CACHE_TTL_MS`
 * (default 300_000 ms).
 *
 * ── Write path — `upsertEnvConfigOverride(input)` ──
 *   Validates the key against the registry, rejects `excludeFromDb` keys,
 *   persists via `SystemSettingsRepository.upsertSetting` under `env::<key>`,
 *   and invalidates the resolver cache so the new value is picked up.
 *
 * ── Delete path — `deleteEnvConfigOverride(key)` ──
 *   Validates the key, removes the DB override row, and invalidates the
 *   resolver cache.
 *
 * ── List path — `listEnvConfigEntries()` ──
 *   Walks DB-eligible `ENV_CONFIG_KEYS` and consults `system_settings` for a DB
 *   override. Keys flagged `excludeFromDb` are omitted entirely so env-only values
 *   never reach GraphQL or the frontend. Secret values are masked via
 *   `maskSecretValue` before being surfaced.
 *
 * ── Audit helper — `auditEnvConfigChange(...)` ──
 *   Emits an audit log entry via `AuditService.createManyAuditLogs`. Secret
 *   values are NEVER written to audit logs — only `"***"` placeholders are
 *   recorded for `isSecret` keys.
 *
 * This module is isomorphic-safe: it imports only from `@/backend/**` and never touches
 * `@/app/**` or `next/*` APIs.
 */

import { SystemSettingsRepository } from "@/backend/db/repo/shared";
import { maskSecretValue } from "@/backend/lib";
import {
  ENV_CONFIG_KEYS,
  type EnvConfigKeyDescriptor,
  isEnvConfigKeyExposedInSettings,
} from "@/backend/lib/env-config-keys";
import { logger } from "@/backend/lib/logger";
import { AuditService } from "@/backend/services/system/audit.service";
import type {
  CreateAuditLogInput,
  EnvConfigAuditCreateInput,
  EnvConfigAuditEvent,
  EnvConfigCategory,
  EnvConfigDeleteReturnType,
  EnvConfigEntry,
  EnvConfigUpsertInput,
  EnvConfigUpsertReturnType,
} from "@/backend/types";
import { SystemSettingCategory, SystemSettingDataType } from "@/shared/constants/settings/system-settings.enum";

// ─── Shared constants & helpers ─────────────────────────────────────────────────

/** Prefix applied to env var names when reading/writing DB overrides in `system_settings`. */
const ENV_SETTING_KEY_PREFIX = "env::";

/** Returns the DB storage key for an env var (applies the `env::` prefix). */
function toDbKey(envKey: string): string {
  return `${ENV_SETTING_KEY_PREFIX}${envKey}`;
}

/** Reads an env var from `process.env`, treating empty string as unset. */
function readFromProcessEnv(envKey: string): string | undefined {
  const value = process.env[envKey];
  return value === "" || value === undefined ? undefined : value;
}

/** Lazily-built index of registered env-config descriptors, keyed by env var name. */
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
 * Returns true if the key is registered with `excludeFromDb === true`.
 *
 * Keys flagged `excludeFromDb` bypass both the DB lookup AND the cache — they are always
 * read fresh from `process.env`. This contract is enforced here, not at the call site.
 */
function isExcludedFromDb(envKey: string): boolean {
  return getDescriptorIndex().get(envKey)?.excludeFromDb === true;
}

function getSettingsExposedDescriptor(key: string): EnvConfigKeyDescriptor | undefined {
  const descriptor = getDescriptorIndex().get(key);
  if (descriptor === undefined || !isEnvConfigKeyExposedInSettings(descriptor)) {
    return undefined;
  }
  return descriptor;
}

// ─── Cache infrastructure (module-scoped singleton) ────────────────────────────

/** Default cache TTL: 5 minutes. Overridable via `ENV_CONFIG_CACHE_TTL_MS` env var. */
const DEFAULT_CACHE_TTL_MS = 300_000;

/**
 * Module-scoped singleton cache entry. Shared across all callers in the module (not
 * per-instance) so that invalidation via `invalidateEnvConfigCache` is globally observable.
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

// ─── Typed service errors ──────────────────────────────────────────────────────

/** Discriminator for typed service errors (machine-readable, never thrown as plain `Error`). */
export type EnvConfigServiceErrorCode = "ENOT_IN_REGISTRY" | "ENOT_DB_MANAGED";

/**
 * Typed error thrown by the env-config service.
 *
 * Carries a stable `code` field so callers (e.g. GraphQL resolvers) can map
 * to localized error strings without regex-matching `message`.
 */
export class EnvConfigServiceError extends Error {
  readonly code: EnvConfigServiceErrorCode;

  constructor(code: EnvConfigServiceErrorCode, message: string) {
    super(message);
    this.name = "EnvConfigServiceError";
    this.code = code;
  }
}

// ─── Read path: single-key resolver ─────────────────────────────────────────────

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

// ─── Read path: batch resolver ──────────────────────────────────────────────────

/**
 * Splits `keys` into `excludeFromDb` keys (resolved directly from `process.env` into
 * `result` with no DB round-trip and no caching) and DB-eligible keys (returned for
 * batched lookup). Factored out to keep cognitive complexity under the SonarJS limit.
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
 * Serves DB-eligible keys from the in-memory cache where fresh, writing hits into
 * `result`, and returns the list of keys that still require a DB round-trip. Factored
 * out to keep cognitive complexity under the SonarJS limit.
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
 * returning `undefined` so callers can fall back to `process.env`. Factored out to keep
 * the batch function's cognitive complexity under the SonarJS limit.
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
 * `excludeFromDb` keys are resolved directly from `process.env` without a DB round-trip
 * and without caching. All remaining (DB-eligible) keys are fetched concurrently (one
 * `SystemSettingsRepository.getByKey` call each) and cached individually with the same
 * TTL as `resolveEnvConfig`.
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

  const lookupResults = await Promise.all(missesNeedingDb.map(key => lookupDbValueFor(key)));
  for (const [key, dbValue] of lookupResults) {
    recordResolvedKey(key, dbValue, result, now, ttlMs);
  }

  return result;
}

// ─── Cache management ───────────────────────────────────────────────────────────

/**
 * Invalidates the env-config cache.
 *
 * - If `key` is omitted, clears the entire module-scoped cache so every subsequent call
 *   must re-query the DB (or re-read `process.env`).
 * - If `key` is provided, drops only that key's cache entry. The next call for that key
 *   will perform a fresh DB / env lookup.
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

// ─── List path: Settings → Environment Config tab ───────────────────────────────

/** Resolved source/value pair for a single env-config key. */
interface ResolvedEntry {
  value: string | undefined;
  source: EnvConfigEntry["source"];
  hasDbOverride: boolean;
}

const VALID_ENTRY_CATEGORIES: ReadonlySet<string> = new Set([
  "email",
  "sms",
  "push",
  "fx",
  "cache",
  "redis",
  "storage",
  "auth",
  "app",
  "meeting",
  "billing",
  "whatsapp",
  "general",
]);

function isEntryCategory(value: string): value is EnvConfigCategory {
  return VALID_ENTRY_CATEGORIES.has(value);
}

/** Narrows a descriptor category to the `EnvConfigEntry["category"]` union. */
function toEntryCategory(category: string): EnvConfigCategory {
  return isEntryCategory(category) ? category : "general";
}

/** Resolves a DB-eligible key: DB override wins, else falls back to `process.env`. */
async function resolveDbEligibleKey(key: string): Promise<ResolvedEntry> {
  const dbKey = toDbKey(key);
  let dbValue: string | undefined;
  try {
    const setting = await SystemSettingsRepository.getByKey(dbKey);
    if (setting?.value != null && setting.value !== "") {
      dbValue = setting.value;
    }
  } catch (error) {
    logger.warn(
      `env-config-service: DB lookup failed for key "${key}", falling back to process.env. Error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  if (dbValue !== undefined) {
    return { value: dbValue, source: "db", hasDbOverride: true };
  }
  const envValue = readFromProcessEnv(key);
  return { value: envValue, source: envValue ? "env" : "unset", hasDbOverride: false };
}

/**
 * List DB-manageable env-config entries with their resolved source/value.
 *
 * Keys flagged `excludeFromDb` are never included — env-only values stay on the server.
 * Listed keys consult `system_settings` under `env::<key>`; a non-empty DB row wins
 * over `process.env`. Secret keys have their `value` masked via `maskSecretValue`.
 */
export async function listEnvConfigEntries(): Promise<EnvConfigEntry[]> {
  const exposedDescriptors = ENV_CONFIG_KEYS.filter(d => isEnvConfigKeyExposedInSettings(d));

  const resolvedResults = await Promise.all(exposedDescriptors.map(d => resolveDbEligibleKey(d.key)));

  return exposedDescriptors.map((descriptor, i) => {
    const { key, category, description, isSecret, displayStrategy } = descriptor;
    const resolved = resolvedResults[i];

    return {
      key,
      category: toEntryCategory(category),
      displayStrategy,
      description,
      isSecret,
      excludeFromDb: false,
      value: isSecret ? maskSecretValue(resolved.value) : resolved.value,
      source: resolved.source,
      hasDbOverride: resolved.hasDbOverride,
      editable: true,
    };
  });
}

// ─── Write path ─────────────────────────────────────────────────────────────────

/**
 * Create or update a DB override for an env-config key.
 *
 * Rejects keys not present in the registry, and keys flagged `excludeFromDb`
 * (which by contract cannot be persisted in `system_settings`).
 *
 * After a successful upsert, invalidates the resolver cache for the key so
 * the new value is picked up on the next read.
 */
export async function upsertEnvConfigOverride(input: EnvConfigUpsertInput): Promise<EnvConfigUpsertReturnType> {
  const descriptor = getSettingsExposedDescriptor(input.key);
  if (descriptor === undefined) {
    throw new EnvConfigServiceError(
      "ENOT_IN_REGISTRY",
      `Environment config key "${input.key}" is not in the registry.`
    );
  }

  const dbKey = toDbKey(input.key);
  logger.info(`env-config-service: upserting DB override for key "${input.key}"`);

  const row = await SystemSettingsRepository.upsertSetting({
    key: dbKey,
    value: input.value,
    dataType: SystemSettingDataType.String,
    description: descriptor.description.en,
    category: SystemSettingCategory.System,
    updatedByUserId: null,
  });

  invalidateEnvConfigCache(input.key);

  return {
    key: input.key,
    source: "db",
    hasDbOverride: true,
    updatedAt: row.updatedAt ?? new Date(),
  };
}

// ─── Delete path ────────────────────────────────────────────────────────────────

/**
 * Delete the DB override for an env-config key.
 *
 * Rejects keys flagged `excludeFromDb`. After deletion, invalidates the
 * resolver cache so the next read falls back to `process.env`.
 */
export async function deleteEnvConfigOverride(key: string): Promise<EnvConfigDeleteReturnType> {
  const descriptor = getSettingsExposedDescriptor(key);
  if (descriptor === undefined) {
    throw new EnvConfigServiceError("ENOT_IN_REGISTRY", `Environment config key "${key}" is not in the registry.`);
  }

  const dbKey = toDbKey(key);
  logger.info(`env-config-service: deleting DB override for key "${key}"`);

  let existed = false;
  try {
    const setting = await SystemSettingsRepository.getByKey(dbKey);
    existed = setting != null;
  } catch (error) {
    logger.warn(
      `env-config-service: pre-delete existence check failed for key "${key}". Error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  await SystemSettingsRepository.deleteSetting(dbKey);
  invalidateEnvConfigCache(key);

  const envFallback = readFromProcessEnv(key);
  return {
    key,
    deleted: existed,
    source: envFallback ? "env" : "unset",
  };
}

// ─── Audit path ─────────────────────────────────────────────────────────────────

/**
 * Audit an env-config change to the `audit_logs` table.
 *
 * For `isSecret` keys, the raw `priorValue`/`newValue` are NEVER written —
 * only `"***"` placeholders are recorded.
 *
 * Maps the env-config audit input onto the canonical `CreateAuditLogInput`
 * shape used by `AuditService.createManyAuditLogs`.
 */
export async function auditEnvConfigChange(
  actorUserId: string,
  action: "upsert" | "delete",
  key: string,
  priorValue?: string,
  newValue?: string
): Promise<void> {
  const descriptor = getDescriptorIndex().get(key);
  const isSecret = descriptor?.isSecret === true;

  const event: EnvConfigAuditEvent = action === "upsert" ? "env_config.upsert" : "env_config.delete";

  const auditInput: EnvConfigAuditCreateInput = {
    actorUserId,
    event,
    key,
    priorValue: isSecret ? "***" : priorValue,
    newValue: isSecret ? "***" : newValue,
  };

  const createAuditLogInput: CreateAuditLogInput = {
    actorUserId,
    actorType: "USER",
    entityType: "SYSTEM_SETTING",
    entityId: toDbKey(key),
    action: action === "upsert" ? "UPDATE" : "DELETE",
    description: `${event} for ${key}`,
    previousState: auditInput.priorValue !== undefined ? { value: auditInput.priorValue } : null,
    newState: auditInput.newValue !== undefined ? { value: auditInput.newValue } : null,
    metadata: { event, key },
  };

  try {
    await AuditService.createManyAuditLogs([createAuditLogInput]);
  } catch (error) {
    logger.error(
      `env-config-service: failed to write audit log for ${event} on key "${key}". Error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
