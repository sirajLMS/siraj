import type { whatsappAccounts } from "@/backend/db/schema";
import type {
  WhatsappLimitTier,
  WhatsappQualityRating,
  WhatsappTemplateCategory,
  WhatsappTemplateStatus,
} from "@/backend/enum/whatsapp/whatsapp.enum";
import type {
  WhatsappAccountPurpose,
  WhatsappOnboardingMode,
  WhatsappSyncStatus,
} from "@/backend/enum/whatsapp/whatsapp-account.enum";

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
  | "purpose"
  | "onboardingMode"
  | "syncStatus"
> & {
  qualityRating: WhatsappQualityRating | null;
  portfolioMessagingLimitTier: WhatsappLimitTier | null;
  purpose: WhatsappAccountPurpose;
  onboardingMode: WhatsappOnboardingMode;
  syncStatus: WhatsappSyncStatus;
};

/**
 * Submit input for client-driven account creation. Server-managed sync
 * tracking columns (`syncStatus`, `syncPhase`, `syncProgress`,
 * `syncDeadlineAt`, `syncFailureReason`, `offboardedAt`) are excluded by
 * construction — the coexistence sync lifecycle mutates them through
 * `WhatsappAccountUpdateInput`, never through client input. `purpose` and
 * `onboardingMode` stay client-selectable with enum typing.
 */
type WhatsappAccountSubmitInput = Omit<
  WhatsappAccountInsertType,
  // auto-generated
  | "id"
  | "createdAt"
  | "updatedAt"
  | "lastWebhookAt"
  // re-applied below with enum typing
  | "purpose"
  | "onboardingMode"
  // sync lifecycle state — server-managed, never client-supplied
  | "syncStatus"
  | "syncPhase"
  | "syncProgress"
  | "syncDeadlineAt"
  | "syncFailureReason"
  | "offboardedAt"
> & {
  purpose?: WhatsappAccountPurpose;
  onboardingMode?: WhatsappOnboardingMode;
};

/**
 * Partial update input for existing WhatsApp accounts.
 *
 * Based on `WhatsappAccountInsertType` (not `SelectType`) so that DB-managed
 * auto-generated fields (`id`, `createdAt`, `updatedAt`) and credential
 * columns (which go through dedicated `SetWhatsappAccessTokenInput` /
 * `SetWhatsappTwoStepPinInput` mutations) are excluded by construction.
 * `lastWebhookAt` is intentionally retained — the webhook handler uses it
 * to stamp inbound webhook timestamps on the account row. The sync-tracking
 * columns are system-managed (webhook handler + sync service) and re-applied
 * here with enum typing.
 */
export type WhatsappAccountUpdateInput = Partial<
  Omit<
    WhatsappAccountInsertType,
    | "id"
    | "createdAt"
    | "updatedAt"
    | "encryptedAccessToken"
    | "encryptedTwoStepPin"
    | "purpose"
    | "onboardingMode"
    | "syncStatus"
  > & {
    purpose?: WhatsappAccountPurpose;
    onboardingMode?: WhatsappOnboardingMode;
    syncStatus?: WhatsappSyncStatus;
  }
>;

/**
 * Separate mutation inputs for credential updates.
 * The service layer encrypts these before passing to the repository.
 */
export type SetWhatsappAccessTokenInput = {
  id: string;
  encryptedAccessToken: string;
  isActive?: boolean;
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
 * Configuration status for the WhatsApp Cloud API integration.
 *
 * This is an intentional **status value-object type** — it is computed on
 * demand by the service layer (account validation + env-config resolution),
 * not derived from a Drizzle table. `missingEnvKeys` is computed independently
 * of account validity so UIs can explain why the env-bootstrap path is or is
 * not available even when a valid DB account exists.
 */
export type WhatsappConfigurationStatusType = {
  /** True when at least one active account validates OR the env-bootstrap path is fully configured. */
  readonly isConfigured: boolean;
  /** True when every required env-bootstrap key resolves to a non-empty value. */
  readonly envBootstrapAvailable: boolean;
  /** Exact env key names (e.g. `WHATSAPP_ACCESS_TOKEN`) that are unset or empty. */
  readonly missingEnvKeys: readonly string[];
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
  /**
   * Routing purpose for the send. The dispatch layer resolves the sending
   * account by purpose (falling back to the active GENERAL account);
   * absent means GENERAL.
   */
  readonly purpose?: WhatsappAccountPurpose | null;
};

/**
 * Submit input for `completeEmbeddedSignup` (coexistence onboarding).
 *
 * `code` is the single-use authorization code captured by the Embedded
 * Signup session listener; `wabaId` (and optionally `phoneNumberId`,
 * `businessId`) come from Meta's `WA_EMBEDDED_SIGNUP` session events. When
 * only `wabaId` is present, the server resolves the phone number via
 * `GET /{waba_id}/phone_numbers`. `config_id` is intentionally NOT part of
 * this input — it is resolved server-side from env-config.
 */
export type WhatsappEmbeddedSignupSubmitInput = {
  readonly code: string;
  readonly wabaId: string;
  readonly phoneNumberId?: string;
  readonly businessId?: string | null;
};
