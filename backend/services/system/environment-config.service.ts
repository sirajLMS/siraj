/**
 * Service-layer API for the Settings → Environment Config tab.
 *
 * This service is the bridge between the read path (env-config resolver) and
 * the write path (`system_settings` repository, keyed under `env::<KEY>`).
 *
 * Read path  — `listEnvConfigEntries()`:
 *   Walks DB-eligible `ENV_CONFIG_KEYS` and consults `system_settings` for a DB
 *   override. Keys flagged `excludeFromDb` are omitted entirely so env-only values
 *   never reach GraphQL or the frontend. Secret values are masked via
 *   `maskSecretValue` before being surfaced.
 *
 * Write path — `upsertEnvConfigOverride(input)`:
 *   Validates the key against the registry, rejects `excludeFromDb` keys,
 *   persists via `SystemSettingsRepository.upsertSetting` under `env::<key>`,
 *   and invalidates the resolver cache so the new value is picked up.
 *
 * Delete path — `deleteEnvConfigOverride(key)`:
 *   Validates the key, removes the DB override row, and invalidates the
 *   resolver cache.
 *
 * Audit helper — `auditEnvConfigChange(...)`:
 *   Emits an audit log entry via `AuditService.createManyAuditLogs`. Secret
 *   values are NEVER written to audit logs — only `"***"` placeholders are
 *   recorded for `isSecret` keys.
 */

import { SystemSettingsRepository } from "@/backend/db/repo";
import type { EnvConfigKeyDescriptor } from "@/backend/lib/env-config-keys";
import { ENV_CONFIG_KEYS, isEnvConfigKeyExposedInSettings } from "@/backend/lib/env-config-keys";
import { invalidateEnvConfigCache } from "@/backend/lib/env-config-resolver";
import { logger } from "@/backend/lib/logger";
import { AuditService } from "@/backend/services/system/audit.service";
import type { CreateAuditLogInput } from "@/backend/types";
import type { EnvConfigAuditCreateInput, EnvConfigAuditEvent } from "@/backend/types/audit/env-config-audit.types";
import type {
  EnvConfigCategory,
  EnvConfigDeleteReturnType,
  EnvConfigEntry,
  EnvConfigUpsertInput,
  EnvConfigUpsertReturnType,
} from "@/backend/types/shared/env-config.types";
import { maskSecretValue } from "@/backend/types/shared/env-config.types";
import { SystemSettingCategory, SystemSettingDataType } from "@/shared/constants/settings/system-settings.enum";

/** Prefix applied to env var names when reading/writing DB overrides in `system_settings`. */
const ENV_SETTING_KEY_PREFIX = "env::";

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

function getSettingsExposedDescriptor(key: string): EnvConfigKeyDescriptor | undefined {
  const descriptor = getDescriptorIndex().get(key);
  if (descriptor === undefined || !isEnvConfigKeyExposedInSettings(descriptor)) {
    return undefined;
  }
  return descriptor;
}

/** Returns the DB storage key for an env var (applies the `env::` prefix). */
function toDbKey(envKey: string): string {
  return `${ENV_SETTING_KEY_PREFIX}${envKey}`;
}

/** Reads an env var from `process.env`, treating empty string as unset. */
function readFromProcessEnv(envKey: string): string | undefined {
  const value = process.env[envKey];
  return value === "" || value === undefined ? undefined : value;
}

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
