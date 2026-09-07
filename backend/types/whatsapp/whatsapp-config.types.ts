import type { whatsappConfigs } from "@/backend/db/schema";

/**
 * Canonical type definitions for the `whatsapp_configs` entity — the
 * single-row store for WhatsApp Cloud API credentials managed from the
 * settings page.
 *
 * `SelectType` returns decrypted values for the encrypted columns
 * (`appSecret`, `accessToken`) — the `encryptedText` custom type decrypts at
 * the driver boundary. Those values must never be surfaced to clients
 * unmasked; API layers expose masked views instead.
 */
export type WhatsappConfigSelectType = typeof whatsappConfigs.$inferSelect;
export type WhatsappConfigInsertType = typeof whatsappConfigs.$inferInsert;

/**
 * Payload for creating/updating the configuration row from seeding or
 * bootstrap flows. DB-managed columns (`id`, `createdAt`, `updatedAt`) are
 * excluded — the driver applies their defaults on insert.
 */
export type WhatsappConfigSeedInput = Omit<WhatsappConfigInsertType, "id" | "createdAt" | "updatedAt">;

/**
 * Where the active credential values were resolved from. `"db"` means the
 * singleton row exists and is authoritative (admin-managed); `"env"` means
 * either the row has never been saved or the database was unreachable, so
 * the `WHATSAPP_*` env-config keys were used instead.
 */
export type WhatsappConfigSource = "db" | "env";

/**
 * Credential set actively used by the integration, resolved with the
 * DB-first / env-fallback order. Row-level semantics: when a saved row
 * exists its values are authoritative as a whole (nulls stay null), so an
 * admin-cleared field is never silently resurrected from the environment.
 *
 * `appSecret` and `accessToken` are decrypted values — API layers must only
 * ever expose masked views of them.
 */
export interface WhatsappConfigResolvedType {
  readonly source: WhatsappConfigSource;
  readonly appId: string | null;
  readonly appSecret: string | null;
  readonly verifyToken: string | null;
  readonly phoneNumberId: string | null;
  readonly wabaId: string | null;
  readonly accessToken: string | null;
  readonly esConfigId: string | null;
}

/**
 * Outcome of the lightweight Meta Graph API connectivity check. `message` is
 * a localized, user-friendly string that never contains tokens or raw
 * provider error details; `phoneNumber` is the display number Meta returns
 * for the configured phone number ID when the check succeeds.
 */
export interface WhatsappConnectionTestResult {
  readonly success: boolean;
  readonly message: string;
  readonly phoneNumber?: string;
}
