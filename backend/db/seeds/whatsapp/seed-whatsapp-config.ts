import { logger } from "@/backend/lib/logger";
import type { WhatsappConfigSeedInput, WhatsappConfigSelectType } from "@/backend/types";

type WhatsappConfigSeedColumn = Exclude<keyof WhatsappConfigSeedInput, "updatedByUserId">;

/** Env variables that map onto `whatsapp_configs` columns when present. */
const WHATSAPP_CONFIG_ENV_SOURCES = [
  { column: "appId", envKey: "WHATSAPP_APP_ID" },
  { column: "appSecret", envKey: "WHATSAPP_APP_SECRET" },
  { column: "verifyToken", envKey: "WHATSAPP_VERIFY_TOKEN" },
  { column: "phoneNumberId", envKey: "WHATSAPP_PHONE_NUMBER_ID" },
  { column: "wabaId", envKey: "WHATSAPP_WABA_ID" },
  { column: "accessToken", envKey: "WHATSAPP_ACCESS_TOKEN" },
  { column: "esConfigId", envKey: "WHATSAPP_ES_CONFIG_ID" },
] satisfies readonly { column: WhatsappConfigSeedColumn; envKey: string }[];

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
 * Only variables that are actually set are carried over; when none are set
 * the seeder is a no-op and the service layer keeps resolving from env.
 * Encrypted columns (`appSecret`, `accessToken`) are handed over as plaintext
 * — the `encryptedText` column type encrypts at the driver boundary, so no
 * secret is ever logged or stored unencrypted.
 */
export async function seedOrGet(
  options: WhatsappConfigSeedOptions = {}
): Promise<WhatsappConfigSelectType | undefined> {
  const payload: WhatsappConfigSeedInput = {};
  const carriedColumns: WhatsappConfigSeedColumn[] = [];

  for (const { column, envKey } of WHATSAPP_CONFIG_ENV_SOURCES) {
    const value = process.env[envKey];
    if (!value) continue;
    payload[column] = value;
    carriedColumns.push(column);
  }

  if (carriedColumns.length === 0) {
    logger.info("WhatsApp config seed skipped — no WHATSAPP_* environment variables are set.");
    return undefined;
  }

  if (options.actorUserId) {
    payload.updatedByUserId = options.actorUserId;
  }

  if (!options.persist) {
    logger.warn(
      `WhatsApp config env vars detected (${carriedColumns.join(", ")}) but no persistence handler is registered — keeping env as the config source.`
    );
    return undefined;
  }

  const row = await options.persist(payload);
  logger.info(`WhatsApp config seeded from environment (${carriedColumns.length} fields).`);
  return row;
}
