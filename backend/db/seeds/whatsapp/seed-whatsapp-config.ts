import { logger } from "@/backend/lib/logger";
import {
  WHATSAPP_CONFIG_ENV_SOURCES,
  WHATSAPP_CONFIG_FIELD_MAX_LENGTHS,
  type WhatsappConfigCredentialField,
} from "@/backend/lib/whatsapp-constants";
import type { WhatsappConfigSeedInput, WhatsappConfigSelectType } from "@/backend/types";

/**
 * Persists a configuration row and returns the stored entity. Wired by the
 * master controller to the WhatsApp config service bootstrap method.
 */
type WhatsappConfigSeedPersist = (input: WhatsappConfigSeedInput) => Promise<WhatsappConfigSelectType>;

export interface WhatsappConfigSeedOptions {
  /** Admin attributed as the initial editor of the row. */
  actorUserId?: string;
  /**
   * Look-before-create gate: returns true when the singleton configuration
   * row already exists. When it does, this seeder must not persist — a
   * re-run that re-persists the env payload would silently revert
   * admin-saved credentials (the stored row is authoritative once written).
   */
  hasExisting?: () => Promise<boolean>;
  /**
   * Resolves the `WHATSAPP_*` values to carry over, using the config
   * service's env resolution (`WhatsappConfigService.resolveEnvCarryOver()`):
   * DB override first (`system_settings` `env::<key>` rows), then
   * `process.env`, blank = unset. Supplying it keeps the seed consistent with
   * what the enforcement paths actually resolve. Without it the seeder falls
   * back to a raw `process.env` read (CLI/test fallback — pre-resolution
   * semantics).
   */
  resolveEnvValues?: () => Promise<WhatsappConfigSeedInput>;
  /** Persistence handler; without it env-sourced values remain authoritative. */
  persist?: WhatsappConfigSeedPersist;
}

/**
 * Reads the carry-over payload. Prefers the service-side resolver; falls back
 * to a raw `process.env` scan (blank = unset, mirroring the service's env
 * resolution semantics) when no resolver is wired.
 */
async function resolveCarryOver(options: WhatsappConfigSeedOptions): Promise<WhatsappConfigSeedInput> {
  if (options.resolveEnvValues) {
    return options.resolveEnvValues();
  }
  const payload: WhatsappConfigSeedInput = {};
  for (const { field, envKey } of WHATSAPP_CONFIG_ENV_SOURCES) {
    const value = process.env[envKey]?.trim() ?? "";
    if (value === "") continue;
    payload[field] = value;
  }
  return payload;
}

/**
 * Look-before-create gate: returns true when the seeder must stand down
 * because a configuration row already exists (or its existence could not be
 * verified). Fail-safe on read errors — writing would risk reverting an
 * existing admin-saved row.
 */
async function shouldSkipExisting(options: WhatsappConfigSeedOptions): Promise<boolean> {
  if (!options.hasExisting) {
    return false;
  }
  let existing: boolean;
  try {
    existing = await options.hasExisting();
  } catch (error) {
    logger.warn(
      `WhatsApp config seed could not verify whether a configuration row already exists — leaving any stored configuration untouched. ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return true;
  }
  if (existing) {
    logger.info(
      "WhatsApp config seed skipped — an existing configuration row was found and left untouched (stored credentials are authoritative over env re-runs)."
    );
    return true;
  }
  return false;
}

/**
 * Seeds the WhatsApp Cloud API configuration from the resolved `WHATSAPP_*`
 * values so a deployment that configured the integration via env keeps
 * working after the database-first resolution order is introduced.
 *
 * The values come from the config service's env resolution (see
 * {@link WhatsappConfigSeedOptions.resolveEnvValues}) — DB override first,
 * then `process.env` — so a seeded row always matches what the enforcement
 * paths resolve. Only non-blank values are carried over; over-length values
 * are skipped with a warning (field name only, never the value) instead of
 * failing the whole bootstrap — one bad environment variable must not stand
 * down the rest of the carry-over. When nothing is carried the seeder is a
 * no-op and the service layer keeps resolving from env.
 *
 * The persist path runs only when the `whatsapp_configs` table has no row yet
 * (look-before-create): once a row exists it is authoritative and a re-run
 * leaves it untouched, so re-seeding can never revert credentials an admin
 * saved through the settings UI. Residual window (CLI-only, accepted): the
 * existence check and the persist are two separate steps — an admin saving a
 * configuration between the check and the persist would be overwritten by
 * this seeder's payload. Seeds run at bootstrap before the admin UI is
 * meaningfully used, so the window is not closed with a heavier
 * transactional re-check.
 *
 * Encrypted columns (`appSecret`, `accessToken`) are handed over as plaintext
 * — the `encryptedText` column type encrypts at the driver boundary, so no
 * secret is ever logged or stored unencrypted.
 */
export async function seedOrGet(
  options: WhatsappConfigSeedOptions = {}
): Promise<WhatsappConfigSelectType | undefined> {
  const payload: WhatsappConfigSeedInput = {};
  const carriedFields: WhatsappConfigCredentialField[] = [];

  const resolved = await resolveCarryOver(options);
  for (const { field } of WHATSAPP_CONFIG_ENV_SOURCES) {
    const value = resolved[field];
    if (typeof value !== "string" || value === "") continue;
    // Tolerate over-length environment values in the seed path only: the
    // save path's per-field caps would otherwise abort the whole bootstrap
    // on one bad variable. Skip the field with a warning (field name only —
    // the value is never logged) and keep seeding the rest.
    if (value.length > WHATSAPP_CONFIG_FIELD_MAX_LENGTHS[field]) {
      logger.warn(
        `WhatsApp config seed skipped "${field}" — the resolved value exceeds the accepted length of ${WHATSAPP_CONFIG_FIELD_MAX_LENGTHS[field]} characters.`
      );
      continue;
    }
    payload[field] = value;
    carriedFields.push(field);
  }

  if (carriedFields.length === 0) {
    logger.info("WhatsApp config seed skipped — no WHATSAPP_* values are configured.");
    return undefined;
  }

  if (await shouldSkipExisting(options)) {
    return undefined;
  }

  if (options.actorUserId) {
    payload.updatedByUserId = options.actorUserId;
  }

  if (!options.persist) {
    logger.warn(
      `WhatsApp config env vars detected (${carriedFields.join(", ")}) but no persistence handler is registered — keeping env as the config source.`
    );
    return undefined;
  }

  const row = await options.persist(payload);
  logger.info(`WhatsApp config seeded from environment (${carriedFields.length} fields).`);
  return row;
}
