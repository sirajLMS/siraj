import { logger } from "@/backend/lib/logger";
import { WHATSAPP_CONFIG_ENV_SOURCES, type WhatsappConfigCredentialField } from "@/backend/lib/whatsapp-constants";
import type { WhatsappConfigSeedInput, WhatsappConfigSelectType } from "@/backend/types";

/**
 * Persists a configuration row and returns the stored entity. Wired by the
 * master controller to the WhatsApp config service bootstrap method.
 */
export type WhatsappConfigSeedPersist = (input: WhatsappConfigSeedInput) => Promise<WhatsappConfigSelectType>;

export interface WhatsappConfigSeedOptions {
  /** Admin attributed as the initial editor of the row. */
  actorUserId?: string;
  /** Persistence handler; without it env-sourced values remain authoritative. */
  persist?: WhatsappConfigSeedPersist;
}

/**
 * Seeds the WhatsApp Cloud API configuration from `WHATSAPP_*` environment
 * variables so a deployment that configured the integration via env keeps
 * working after the database-first resolution order is introduced.
 *
 * Only variables set to a non-blank value are carried over (a whitespace-only
 * value counts as unset, mirroring the service's env resolution semantics);
 * when none are the seeder is a no-op and the service layer keeps resolving
 * from env.
 * Encrypted columns (`appSecret`, `accessToken`) are handed over as plaintext
 * — the `encryptedText` column type encrypts at the driver boundary, so no
 * secret is ever logged or stored unencrypted.
 */
export async function seedOrGet(
  options: WhatsappConfigSeedOptions = {}
): Promise<WhatsappConfigSelectType | undefined> {
  const payload: WhatsappConfigSeedInput = {};
  const carriedFields: WhatsappConfigCredentialField[] = [];

  for (const { field, envKey } of WHATSAPP_CONFIG_ENV_SOURCES) {
    // Trim and treat the blank result as unset so the seeder agrees with the
    // service's env resolution on what "configured" means.
    const value = process.env[envKey]?.trim() ?? "";
    if (value === "") continue;
    payload[field] = value;
    carriedFields.push(field);
  }

  if (carriedFields.length === 0) {
    logger.info("WhatsApp config seed skipped — no WHATSAPP_* environment variables are set.");
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
