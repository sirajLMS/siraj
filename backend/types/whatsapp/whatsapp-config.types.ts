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
type WhatsappConfigInsertType = typeof whatsappConfigs.$inferInsert;

/**
 * Payload for creating/updating the configuration row from seeding or
 * bootstrap flows. DB-managed columns (`id`, `createdAt`, `updatedAt`) are
 * excluded — the driver applies their defaults on insert.
 */
export type WhatsappConfigSeedInput = Omit<WhatsappConfigInsertType, "id" | "createdAt" | "updatedAt">;

/**
 * Per-field credential patch of the public GraphQL configuration mutation.
 * Every field is optional and nullable, mirroring the schema exactly: a
 * provided string is written (merged with the stored row), an explicit `null`
 * clears the stored value, and an omitted field keeps its current value.
 * Secrets are accepted in plaintext and encrypted at the driver boundary;
 * they are never echoed back — the mutation returns the masked view instead.
 */
export type WhatsappConfigUpdateInput = Readonly<
  Partial<
    Pick<
      typeof whatsappConfigs.$inferInsert,
      "appId" | "appSecret" | "verifyToken" | "phoneNumberId" | "wabaId" | "accessToken" | "esConfigId"
    >
  >
>;

/**
 * Where the active credential values were resolved from. `"db"` means the
 * singleton row exists and is authoritative (admin-managed); `"env"` means
 * either the row has never been saved or the database was unreachable, so
 * the `WHATSAPP_*` env-config keys were used instead.
 */
export type WhatsappConfigSource = "db" | "env";

/**
 * Credential keys of the resolved type — enumerated once and projected from
 * the `whatsapp_configs` table below, so the resolved shape is DERIVED from
 * the schema (`string | null` per column) instead of hand-written and unable
 * to drift from it.
 */
type WhatsappConfigCredentialKey =
  | "appId"
  | "appSecret"
  | "verifyToken"
  | "phoneNumberId"
  | "wabaId"
  | "accessToken"
  | "esConfigId";

/**
 * Credential set actively used by the integration, resolved with the
 * DB-first / env-fallback order. Row-level semantics: when a saved row
 * exists its values are authoritative as a whole (nulls stay null), so an
 * admin-cleared field is never silently resurrected from the environment.
 *
 * `appSecret` and `accessToken` are decrypted values — API layers must only
 * ever expose masked views of them.
 */
export type WhatsappConfigResolvedType = Readonly<
  Pick<typeof whatsappConfigs.$inferSelect, WhatsappConfigCredentialKey> & {
    readonly source: WhatsappConfigSource;
  }
>;

/**
 * Client-safe view of the active configuration for the settings page, built
 * by the GraphQL layer from a resolved or stored credential set. Carries the
 * resolved credential shape as-is (`source` plus the seven credential
 * fields) with the webhook URL derived on top.
 *
 * `appSecret` and `accessToken` are masked with the shared masked-tail helper
 * (`maskSecretValue` — fixed bullet sentinel plus the last four characters),
 * so no plaintext secret ever crosses the API boundary. `verifyToken` is not
 * secret at rest (it is shared with Meta's webhook subscription) and is
 * surfaced so admins can mirror it into the Meta developer console.
 * `webhookUrl` is derived from the deployment origin at read time, and
 * `source` tells the UI whether the values are database-managed or
 * environment-managed.
 */
export type WhatsappConfigMaskedViewType = WhatsappConfigResolvedType & {
  /** Callback URL Meta must call for webhook events, derived at read time. */
  readonly webhookUrl: string;
};

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
