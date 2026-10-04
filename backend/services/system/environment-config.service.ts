/**
 * Canonical environment-config service — read, write, audit, and list paths.
 *
 * ── Read path (resolver) ──
 * Resolution order per key (first hit wins):
 *  1. Keys registered with `excludeFromDb === true` bypass the DB and the cache and
 *     return `process.env[key]` directly (hard contract for live/secret values).
 *  2. Otherwise the DB override in `system_settings` under `env::<KEY>` is consulted;
 *     `isSecret` values are DECRYPTED here before being returned.
 *  3. A non-empty DB override wins and is cached per key (5-minute default TTL).
 *  4. Otherwise the resolver falls back to `process.env[key]`.
 *
 * ── Write path — `upsertEnvConfigOverride(input)` ──
 *   Validates the key against the registry, rejects `excludeFromDb` keys, persists via
 *   `SystemSettingsRepository.upsertSetting` under `env::<key>`, and invalidates the
 *   resolver cache. `isSecret` values are ENCRYPTED at rest before persistence. Branding
 *   keys ALSO invalidate the SSR appearance cache (AC-30).
 *
 * ── Delete path — `deleteEnvConfigOverride(key)` ──
 *   Validates the key, removes the DB override row, and invalidates the resolver cache.
 *   Branding keys ALSO invalidate the SSR appearance cache (AC-30).
 *
 * ── List path — `listEnvConfigEntries()` ──
 *   Walks DB-eligible `ENV_CONFIG_KEYS`, omits `excludeFromDb` keys, and masks secret
 *   values via `maskSecretValue` before surfacing them.
 *
 * ── Audit helper — `auditEnvConfigChange(...)` ──
 *   Emits an audit entry via `AuditService.createManyAuditLogs`. Secret values are NEVER
 *   written — only `"***"` placeholders.
 *
 * This module is isomorphic-safe: it imports only from `@/backend/**` and `@/shared/**`.
 */

import { logger } from "@/backend/lib/logger";
import { AuditService } from "@/backend/services/system/audit.service";
import {
  clearEnvConfigCache,
  commitDbResolvedValue,
  deleteEnvConfigCacheEntry,
  lookupDbValueFor,
  partitionKeysByDbEligibility,
  performDbLookup,
  preWarmEnvConfigCacheImpl,
  readCachedResolvedValue,
  recordResolvedKey,
  resolveTtl,
  serveFromCache,
} from "@/backend/services/system/environment-config.cache";
import {
  buildEnvConfigAuditLogInput,
  getSettingsExposedDescriptor,
  isExcludedFromDb,
  listEnvConfigEntriesImpl,
  maybeInvalidateAppearanceCache,
  persistEnvConfigOverrideRow,
  probeAndDeleteEnvConfigOverrideRow,
  readFromProcessEnv,
} from "@/backend/services/system/environment-config.helpers";
import type {
  DBTransaction,
  EnvConfigAuditEvent,
  EnvConfigDeleteReturnType,
  EnvConfigEntry,
  EnvConfigUpsertInput,
  EnvConfigUpsertReturnType,
} from "@/backend/types";

export { envConfigEncryptionContext, toEnvSettingDbKey } from "@/backend/services/system/environment-config.helpers";

/** Discriminator for typed service errors (machine-readable, never thrown as plain `Error`). */
export type EnvConfigServiceErrorCode = "ENOT_IN_REGISTRY" | "ENOT_DB_MANAGED";

/**
 * Typed error thrown by the env-config service. Carries a stable `code` field so callers
 * (e.g. GraphQL resolvers) can map to localized error strings without regex-matching `message`.
 */
export class EnvConfigServiceError extends Error {
  readonly code: EnvConfigServiceErrorCode;

  constructor(code: EnvConfigServiceErrorCode, message: string) {
    super(message);
    this.name = "EnvConfigServiceError";
    this.code = code;
  }
}

/**
 * Pre-warm the env-config cache from `process.env` at module load so the first
 * `resolveEnvConfig()` calls on a cold start do not issue DB queries for keys whose
 * env-fallback value is sufficient.
 *
 * @internal Exported for unit testing only — production code should never call this
 *           manually; it runs once at module load.
 */
export function preWarmEnvConfigCache(): void {
  preWarmEnvConfigCacheImpl();
}

/**
 * Resolves a single environment configuration key using the DB-first / env-fallback
 * strategy. `excludeFromDb` keys never touch the DB or the cache. All other keys check
 * the module-scoped TTL cache, then query `system_settings` for `env::<key>`, then fall
 * back to `process.env[key]`. Secret values are NEVER logged — only the key name.
 *
 * @param key Bare env var name (e.g. `"SMTP_HOST"`), without the `env::` prefix.
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
  // Pre-warmed "env" entries are non-authoritative — a DB override may exist. Only a
  // "db" entry (confirmed precedence) or a transient-"env" entry within its short TTL
  // short-circuits; everything else falls through to the DB lookup.
  const cached = readCachedResolvedValue(key, now);
  if (cached.hit) {
    return cached.value;
  }

  logger.debug(`env-config: cache miss for key "${key}", querying system_settings`);
  const { dbValue, dbError, wasTransient } = await performDbLookup(key);
  const ttlMs = resolveTtl(dbError, wasTransient);
  return commitDbResolvedValue(key, dbValue, now, ttlMs, dbError ? "env" : "db", dbError ? wasTransient : false);
}

/**
 * Resolves many environment configuration keys in a single batch. `excludeFromDb` keys
 * are resolved directly from `process.env` without a DB round-trip and without caching;
 * all remaining keys are fetched concurrently and cached with the same TTL as
 * `resolveEnvConfig`.
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
  const missesNeedingDb = serveFromCache(dbEligibleKeys, result, now);
  if (missesNeedingDb.length === 0) {
    return result;
  }

  const lookupResults = await Promise.all(missesNeedingDb.map(key => lookupDbValueFor(key)));
  for (const [key, dbValue, dbError, wasTransient] of lookupResults) {
    const entryTtl = resolveTtl(dbError, wasTransient);
    recordResolvedKey(key, dbValue, result, now, entryTtl, dbError ? "env" : "db", dbError ? wasTransient : false);
  }

  return result;
}

/**
 * Invalidates the env-config cache. Omitting `key` clears the entire cache; providing a
 * key drops only that entry. Has no effect on `excludeFromDb` keys — those are never cached.
 */
export function invalidateEnvConfigCache(key?: string): void {
  if (key === undefined) {
    const size = clearEnvConfigCache();
    if (size > 0) {
      logger.debug(`env-config: invalidated entire cache (${size} entries)`);
    }
    return;
  }
  if (deleteEnvConfigCacheEntry(key)) {
    logger.debug(`env-config: invalidated cache entry for key "${key}"`);
  }
}

/**
 * List DB-manageable env-config entries with their resolved source/value. `excludeFromDb`
 * keys are omitted; a non-empty DB row wins over `process.env`; secret values are masked.
 */
export async function listEnvConfigEntries(): Promise<EnvConfigEntry[]> {
  return listEnvConfigEntriesImpl();
}

/**
 * Create or update a DB override for an env-config key. Rejects keys not present in the
 * registry and keys flagged `excludeFromDb`. After a successful standalone upsert the
 * resolver cache (and, for branding keys, the SSR appearance cache) is invalidated.
 * When `tx` is provided the invalidations are LEFT TO THE CALLER (they must run after commit).
 */
export async function upsertEnvConfigOverride(
  input: EnvConfigUpsertInput,
  tx?: DBTransaction
): Promise<EnvConfigUpsertReturnType> {
  const descriptor = getSettingsExposedDescriptor(input.key);
  if (descriptor === undefined) {
    throw new EnvConfigServiceError(
      "ENOT_IN_REGISTRY",
      `Environment config key "${input.key}" is not in the registry.`
    );
  }

  logger.info(`env-config-service: upserting DB override for key "${input.key}"`);
  const upserted = await persistEnvConfigOverrideRow(input, descriptor, tx);

  if (tx === undefined) {
    invalidateEnvConfigCache(input.key);
    // AC-30 — branding overrides also invalidate the SSR appearance cache so the next
    // render picks up the new branding/preset value. Best-effort: never blocks the write.
    maybeInvalidateAppearanceCache(input.key);
  }

  return {
    key: input.key,
    source: "db",
    hasDbOverride: true,
    // The row's actual stored timestamp (from the upsert's `.returning()`), not a
    // fabricated clock read that could drift from the row.
    updatedAt: upserted.updatedAt,
  };
}

/**
 * Delete the DB override for an env-config key. Rejects keys flagged `excludeFromDb`.
 * After deletion the resolver cache (and, for branding keys, the SSR appearance cache) is
 * invalidated. When `tx` is provided the invalidations are LEFT TO THE CALLER, and the
 * delete is failure-atomic — a failed delete re-throws so the caller's transaction rolls back.
 */
export async function deleteEnvConfigOverride(key: string, tx?: DBTransaction): Promise<EnvConfigDeleteReturnType> {
  const descriptor = getSettingsExposedDescriptor(key);
  if (descriptor === undefined) {
    throw new EnvConfigServiceError("ENOT_IN_REGISTRY", `Environment config key "${key}" is not in the registry.`);
  }

  logger.info(`env-config-service: deleting DB override for key "${key}"`);
  const existed = await probeAndDeleteEnvConfigOverrideRow(key, tx);

  if (tx === undefined) {
    invalidateEnvConfigCache(key);
    // AC-30 — removing a branding override must also invalidate the SSR appearance cache.
    maybeInvalidateAppearanceCache(key);
  }

  const envFallback = readFromProcessEnv(key);
  return {
    key,
    deleted: existed,
    source: envFallback ? "env" : "unset",
  };
}

/**
 * Audit an env-config change to the `audit_logs` table. Secret values are NEVER written —
 * only `"***"` placeholders; URL-shaped non-secret keys have embedded credentials sanitized.
 *
 * WITHOUT `tx` the write is best-effort: a failure is logged and SWALLOWED. WITH `tx` the
 * audit row joins the caller's transaction: a failure is logged and then RETHROWN, aborting
 * that transaction so an audited mutation either commits with its audit row or not at all.
 */
export async function auditEnvConfigChange(
  actorUserId: string,
  action: "upsert" | "delete",
  key: string,
  priorValue?: string,
  newValue?: string,
  tx?: DBTransaction
): Promise<void> {
  const event: EnvConfigAuditEvent = action === "upsert" ? "env_config.upsert" : "env_config.delete";
  const createAuditLogInput = buildEnvConfigAuditLogInput(actorUserId, action, key, priorValue, newValue);

  try {
    await AuditService.createManyAuditLogs([createAuditLogInput], tx);
  } catch (error) {
    logger.error(
      `env-config-service: failed to write audit log for ${event} on key "${key}". Error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    // In-tx audits are part of the caller's atomic write: rethrowing aborts the caller's
    // transaction. Without a tx the audit is a post-hoc side effect — logged-only.
    if (tx !== undefined) {
      throw error;
    }
  }
}

// ─── Module-load pre-warm ────────────────────────────────────────────────────────

try {
  preWarmEnvConfigCache();
} catch (error) {
  logger.warn(
    `env-config: pre-warm at module load failed — falling back to lazy resolution. Error: ${
      error instanceof Error ? error.message : String(error)
    }`
  );
}
