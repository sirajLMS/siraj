import { SystemSettingsRepository } from "@/backend/db/repo/shared";
import { decryptField, encryptField, type FieldEncryptionContext, maskSecretValue } from "@/backend/lib";
import {
  ENV_CONFIG_KEYS,
  type EnvConfigKeyDescriptor,
  isEnvConfigKeyExposedInSettings,
} from "@/backend/lib/env-config-keys";
import { logger } from "@/backend/lib/logger";
import { sanitizeUrlCredentials } from "@/backend/lib/utils/url";
import { revalidateAppearanceCache } from "@/backend/services/appearance/appearance-settings.service";
import type {
  CreateAuditLogInput,
  DBTransaction,
  EnvConfigAuditEvent,
  EnvConfigCategory,
  EnvConfigEntry,
  EnvConfigUpsertInput,
} from "@/backend/types";
import { SystemSettingCategory, SystemSettingDataType } from "@/shared/constants/settings/system-settings.enum";

// ─── Shared constants & key helpers ─────────────────────────────────────────────

/** Prefix applied to env var names when reading/writing DB overrides in `system_settings`. */
const ENV_SETTING_KEY_PREFIX = "env::";

/**
 * Returns the DB storage key for an env var (applies the `env::` prefix).
 * Exported so sibling services that write `env::` rows directly construct the
 * SAME key this module reads/writes — the prefix is defined once.
 */
export function toEnvSettingDbKey(envKey: string): string {
  return `${ENV_SETTING_KEY_PREFIX}${envKey}`;
}

/**
 * Row context bound into encrypted env-config overrides as GCM additional
 * authenticated data. The `env::`-prefixed setting key uniquely identifies the
 * `system_settings` row (it is the primary key), so it serves as the row identity.
 */
export function envConfigEncryptionContext(envKey: string): FieldEncryptionContext {
  return { table: "system_settings", column: "value", rowId: toEnvSettingDbKey(envKey) };
}

// ─── Descriptor index ───────────────────────────────────────────────────────────

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
 * Returns true if the key is registered with `excludeFromDb === true`. Excluded
 * keys bypass both the DB lookup AND the cache — they always read fresh from
 * `process.env`. This contract is enforced here, not at the call site.
 */
export function isExcludedFromDb(envKey: string): boolean {
  return getDescriptorIndex().get(envKey)?.excludeFromDb === true;
}

export function getSettingsExposedDescriptor(key: string): EnvConfigKeyDescriptor | undefined {
  const descriptor = getDescriptorIndex().get(key);
  if (descriptor === undefined || !isEnvConfigKeyExposedInSettings(descriptor)) {
    return undefined;
  }
  return descriptor;
}

/** Reads an env var from `process.env`, treating empty string as unset. */
export function readFromProcessEnv(envKey: string): string | undefined {
  const value = process.env[envKey];
  return value === "" || value === undefined ? undefined : value;
}

/**
 * Decrypts a stored DB override value for an `isSecret` key before it is
 * resolved into a runtime env value. Non-secret values pass through verbatim.
 * A row that LOOKS encrypted but fails to decrypt resolves to `undefined`
 * (logged) so the caller falls back to `process.env` instead of leaking
 * ciphertext into consumers.
 */
export function decryptDbOverrideIfSecret(envKey: string, dbValue: string): string | undefined {
  if (getDescriptorIndex().get(envKey)?.isSecret !== true) {
    return dbValue;
  }
  const decrypted = decryptField(dbValue, envConfigEncryptionContext(envKey));
  if (decrypted === null) {
    logger.error(`env-config: DB override decryption failed for key "${envKey}" — falling back to process.env`);
    return undefined;
  }
  return decrypted;
}

// ─── Appearance-cache invalidation (AC-30) ──────────────────────────────────────

/**
 * Branding env-config keys whose override mutations must also invalidate the SSR
 * appearance cache (AC-30).
 */
const BRANDING_ENV_KEYS: ReadonlySet<string> = new Set(["NEXT_PUBLIC_APP_BRANDING", "APP_THEME_PRESET"]);

/**
 * Best-effort appearance-cache invalidation for branding env-config keys (AC-30).
 * Wrapped in try/catch so a failure in the cache layer never blocks the env-config
 * write — the env-config cache itself is already invalidated by the caller.
 */
export function maybeInvalidateAppearanceCache(envKey: string): void {
  if (!BRANDING_ENV_KEYS.has(envKey)) {
    return;
  }
  try {
    revalidateAppearanceCache();
  } catch (error) {
    logger.warn(
      `env-config-service: failed to invalidate appearance cache after override for key "${envKey}". ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

// ─── List path helpers ──────────────────────────────────────────────────────────

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
  "branding",
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
  const dbKey = toEnvSettingDbKey(key);
  let dbValue: string | undefined;
  try {
    const setting = await SystemSettingsRepository.getByKey(dbKey);
    if (setting?.value != null && setting.value !== "") {
      dbValue = decryptDbOverrideIfSecret(key, setting.value);
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

/** Builds the list-path entry for one exposed descriptor + resolved value. */
function toEnvConfigEntry(descriptor: EnvConfigKeyDescriptor, resolved: ResolvedEntry): EnvConfigEntry {
  const { key, category, description, isSecret, displayStrategy } = descriptor;

  let value = resolved.value;
  if (descriptor.maskUrlCredentials === true && value !== undefined) {
    value = sanitizeUrlCredentials(value);
  }

  return {
    key,
    category: toEntryCategory(category),
    displayStrategy,
    description,
    isSecret,
    excludeFromDb: false,
    value: isSecret ? maskSecretValue(value) : value,
    source: resolved.source,
    hasDbOverride: resolved.hasDbOverride,
    editable: true,
  };
}

/**
 * Lists DB-manageable env-config entries with their resolved source/value.
 * `excludeFromDb` keys are omitted — env-only values stay on the server.
 */
export async function listEnvConfigEntriesImpl(): Promise<EnvConfigEntry[]> {
  const exposedDescriptors = ENV_CONFIG_KEYS.filter(d => isEnvConfigKeyExposedInSettings(d));
  const resolvedResults = await Promise.all(exposedDescriptors.map(d => resolveDbEligibleKey(d.key)));
  return exposedDescriptors.map((descriptor, i) => toEnvConfigEntry(descriptor, resolvedResults[i]));
}

// ─── Write / delete path helpers ────────────────────────────────────────────────

/**
 * Persists the DB override row for a validated descriptor. Secrets are encrypted
 * at rest (aes-256-gcm, bound to the setting row's encryption context) before
 * touching `system_settings`; non-secret values are stored verbatim.
 */
export async function persistEnvConfigOverrideRow(
  input: EnvConfigUpsertInput,
  descriptor: EnvConfigKeyDescriptor,
  tx?: DBTransaction
): Promise<{ updatedAt: Date }> {
  const dbKey = toEnvSettingDbKey(input.key);
  const storedValue = descriptor.isSecret
    ? encryptField(input.value, envConfigEncryptionContext(input.key))
    : input.value;

  return SystemSettingsRepository.upsertSetting(
    {
      key: dbKey,
      value: storedValue,
      dataType: SystemSettingDataType.String,
      description: descriptor.description.en,
      category: SystemSettingCategory.System,
      updatedByUserId: null,
    },
    tx
  );
}

/**
 * Probes for and deletes a DB override row, returning whether a row existed.
 *
 * Inside a transaction the existence probe runs on the SAME connection so it
 * observes the transaction's own uncommitted writes. The repository swallows
 * driver errors into a `false` return; inside a caller transaction that must
 * not pass silently — throw so the transaction rolls back.
 */
export async function probeAndDeleteEnvConfigOverrideRow(key: string, tx?: DBTransaction): Promise<boolean> {
  const dbKey = toEnvSettingDbKey(key);
  let existed = false;
  try {
    const setting = await SystemSettingsRepository.getByKey(dbKey, tx);
    existed = setting != null;
  } catch (error) {
    if (tx !== undefined) {
      throw error;
    }
    logger.warn(
      `env-config-service: pre-delete existence check failed for key "${key}". Error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  const deleted = await SystemSettingsRepository.deleteSetting(dbKey, tx);
  if (tx !== undefined && !deleted) {
    throw new Error(`env-config-service: DB override delete failed for key "${key}" inside transaction`);
  }

  return existed;
}

// ─── Audit path helpers ─────────────────────────────────────────────────────────

/**
 * Builds the canonical audit-log input for an env-config change.
 *
 * For `isSecret` keys the raw prior/new values are NEVER written — only `"***"`
 * placeholders. For URL-shaped `maskUrlCredentials` keys that are not fully
 * secret, embedded credentials are sanitized on both values. Only values that
 * were actually observed are masked: an absent value stays undefined so the row
 * records `null`, never a phantom "***" prior state.
 */
export function buildEnvConfigAuditLogInput(
  actorUserId: string,
  action: "upsert" | "delete",
  key: string,
  priorValue?: string,
  newValue?: string
): CreateAuditLogInput {
  const descriptor = getDescriptorIndex().get(key);
  const isSecret = descriptor?.isSecret === true;
  const maskUrlCreds = descriptor?.maskUrlCredentials === true;

  const event: EnvConfigAuditEvent = action === "upsert" ? "env_config.upsert" : "env_config.delete";

  const maskAuditValue = (value: string | undefined): string | undefined => {
    if (value === undefined) {
      return undefined;
    }
    if (isSecret) {
      return "***";
    }
    if (maskUrlCreds) {
      return sanitizeUrlCredentials(value);
    }
    return value;
  };

  const prior = maskAuditValue(priorValue);
  const next = maskAuditValue(newValue);

  return {
    actorUserId,
    actorType: "USER",
    entityType: "SYSTEM_SETTING",
    entityId: toEnvSettingDbKey(key),
    action: action === "upsert" ? "UPDATE" : "DELETE",
    description: `${event} for ${key}`,
    previousState: prior !== undefined ? { value: prior } : null,
    newState: next !== undefined ? { value: next } : null,
    metadata: { event, key },
  };
}
