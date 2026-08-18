import type { whatsappAccounts } from "@/backend/db/schema";
import type {
  WhatsappLimitTier,
  WhatsappQualityRating,
  WhatsappTemplateCategory,
  WhatsappTemplateStatus,
} from "@/backend/enum/whatsapp/whatsapp.enum";

/**
 * Canonical type definitions for the `whatsapp_accounts` entity.
 *
 * `ReturnType` excludes the encrypted credential columns — they must never
 * surface to GraphQL clients or API responses. The service layer reads them
 * via `SelectType` when it needs the decrypted values (the `encryptedText`
 * custom type auto-decrypts at the driver boundary).
 */

export type WhatsappAccountSelectType = typeof whatsappAccounts.$inferSelect;
export type WhatsappAccountInsertType = typeof whatsappAccounts.$inferInsert;

export type WhatsappAccountReturnType = Omit<
  WhatsappAccountSelectType,
  // Encrypted credentials — never surface to clients
  | "encryptedAccessToken"
  | "encryptedTwoStepPin"
  // Re-applied below with proper enum typing (stored as varchar in DB)
  | "qualityRating"
  | "portfolioMessagingLimitTier"
> & {
  qualityRating: WhatsappQualityRating | null;
  portfolioMessagingLimitTier: WhatsappLimitTier | null;
};

export type WhatsappAccountSubmitInput = Omit<
  WhatsappAccountInsertType,
  // auto-generated
  "id" | "createdAt" | "updatedAt" | "lastWebhookAt"
>;

/**
 * Partial update input for existing WhatsApp accounts.
 *
 * Based on `WhatsappAccountInsertType` (not `SelectType`) so that DB-managed
 * auto-generated fields (`id`, `createdAt`, `updatedAt`) and credential
 * columns (which go through dedicated `SetWhatsappAccessTokenInput` /
 * `SetWhatsappTwoStepPinInput` mutations) are excluded by construction.
 * `lastWebhookAt` is intentionally retained — the webhook handler uses it
 * to stamp inbound webhook timestamps on the account row.
 */
export type WhatsappAccountUpdateInput = Partial<
  Omit<WhatsappAccountInsertType, "id" | "createdAt" | "updatedAt" | "encryptedAccessToken" | "encryptedTwoStepPin">
>;

/**
 * Separate mutation inputs for credential updates.
 * The service layer encrypts these before passing to the repository.
 */
export type SetWhatsappAccessTokenInput = {
  id: string;
  encryptedAccessToken: string;
};

export type SetWhatsappTwoStepPinInput = {
  id: string;
  encryptedTwoStepPin: string;
};

/**
 * Template snapshot returned by Meta's list-message-templates API.
 * Used in both GraphQL sync results and service-layer return types.
 *
 * This is an intentional **value-object type** — it represents a
 * template snapshot from Meta's Cloud API, not a row derived from a Drizzle
 * table. Therefore the canonical `SelectType`/`ReturnType` naming pattern
 * does not apply; this type serves as the canonical shape for the snapshot
 * value object.
 */
export type WhatsappTemplateSnapshot = {
  readonly id: string;
  readonly name: string;
  readonly language: string;
  readonly status: WhatsappTemplateStatus | null;
  readonly category: WhatsappTemplateCategory | null;
  readonly lastSyncedAt?: Date | null;
};

/**
 * Return type for `syncFromMeta` — includes both synced accounts and template snapshots.
 *
 * This is an intentional **result-envelope type** — it is a composite
 * result that bundles accounts and templates from the sync operation, not a
 * single-entity return type derived from a Drizzle table. Therefore the
 * canonical `{Entity}ReturnType` naming pattern does not apply; this type is
 * the canonical envelope for the sync operation result.
 */
export type WhatsappSyncFromMetaReturnType = {
  /** Always populated after successful sync — the GraphQL schema exposes this as nullable for safety, but the service guarantees it. */
  readonly id: string;
  readonly accounts: WhatsappAccountReturnType[];
  readonly templates: readonly WhatsappTemplateSnapshot[];
};

/**
 * Submit input for creating a WhatsApp account.
 * Credentials (access token, two-step PIN) are NOT included here —
 * they go through dedicated `setWhatsappAccessToken` / `setWhatsappTwoStepPin` mutations.
 */
export type WhatsappAccountCreateSubmitInput = Omit<
  WhatsappAccountSubmitInput,
  "encryptedAccessToken" | "encryptedTwoStepPin"
>;

/**
 * Template metadata used by the communication dispatch layer.
 *
 * This is an intentional **value-object type** — it represents
 * WhatsApp template metadata consumed by the dispatch layer (template name,
 * language code, parameter ordering) and is not derived from a Drizzle table.
 * Therefore the canonical `SelectType`/`ReturnType` naming pattern does not
 * apply; this type serves as the canonical shape for the metadata value object.
 */
export type WhatsappTemplateMetadata = {
  readonly name: string;
  readonly languageCode?: string | null;
  readonly paramsOrder?: readonly string[];
};
