import { WhatsappLimitTier, WhatsappQualityRating } from "@/backend/enum/whatsapp/whatsapp.enum";
import {
  WhatsappAccountPurpose,
  WhatsappOnboardingMode,
  WhatsappSyncRequestStatus,
  WhatsappSyncStatus,
  WhatsappSyncType,
} from "@/backend/enum/whatsapp/whatsapp-account.enum";
import { WhatsappMessageDirection, WhatsappWebhookEventStatus } from "@/backend/enum/whatsapp/whatsapp-inbox.enum";
import type { WhatsappAccountReturnType, WhatsappAccountSelectType } from "@/backend/types";

/**
 * Type guard: does `value` match a known `WhatsappQualityRating` member?
 */
export function isValidQualityRating(value: string): value is WhatsappQualityRating {
  return (Object.values(WhatsappQualityRating) as string[]).includes(value);
}

/**
 * Type guard: does `value` match a known `WhatsappLimitTier` member?
 */
export function isValidLimitTier(value: string): value is WhatsappLimitTier {
  return (Object.values(WhatsappLimitTier) as string[]).includes(value);
}

/**
 * Coerce a raw `quality_rating` varchar from the DB / Meta API into a valid
 * `WhatsappQualityRating` enum member. `null` passes through unchanged;
 * unrecognized non-null values fall back to `UNKNOWN`.
 */
export function coerceQualityRating(raw: string | null): WhatsappQualityRating | null {
  if (raw === null) return null;
  return isValidQualityRating(raw) ? raw : WhatsappQualityRating.UNKNOWN;
}

/**
 * Coerce a raw `portfolio_messaging_limit_tier` varchar from the DB / Meta API
 * into a valid `WhatsappLimitTier` enum member. `null` passes through
 * unchanged; unrecognized non-null values fall back to `TIER_NOT_SET`.
 */
export function coerceLimitTier(raw: string | null): WhatsappLimitTier | null {
  if (raw === null) return null;
  return isValidLimitTier(raw) ? raw : WhatsappLimitTier.TIER_NOT_SET;
}

/**
 * Type guard: does `value` match a known `WhatsappAccountPurpose` member?
 */
export function isValidAccountPurpose(value: string): value is WhatsappAccountPurpose {
  return (Object.values(WhatsappAccountPurpose) as string[]).includes(value);
}

/**
 * Type guard: does `value` match a known `WhatsappOnboardingMode` member?
 */
export function isValidOnboardingMode(value: string): value is WhatsappOnboardingMode {
  return (Object.values(WhatsappOnboardingMode) as string[]).includes(value);
}

/**
 * Type guard: does `value` match a known `WhatsappSyncStatus` member?
 */
export function isValidSyncStatus(value: string): value is WhatsappSyncStatus {
  return (Object.values(WhatsappSyncStatus) as string[]).includes(value);
}

/**
 * Coerce a raw `purpose` enum column value into a `WhatsappAccountPurpose`
 * member. Unknown values fall back to `GENERAL`, the routing-safe default.
 */
function coerceAccountPurpose(raw: string): WhatsappAccountPurpose {
  return isValidAccountPurpose(raw) ? raw : WhatsappAccountPurpose.GENERAL;
}

/**
 * Coerce a raw `onboarding_mode` enum column value into a
 * `WhatsappOnboardingMode` member. Unknown values fall back to `CLOUD_API`.
 */
function coerceOnboardingMode(raw: string): WhatsappOnboardingMode {
  return isValidOnboardingMode(raw) ? raw : WhatsappOnboardingMode.CLOUD_API;
}

/**
 * Coerce a raw `sync_status` enum column value into a `WhatsappSyncStatus`
 * member. Unknown values fall back to `NOT_STARTED`.
 */
function coerceSyncStatus(raw: string): WhatsappSyncStatus {
  return isValidSyncStatus(raw) ? raw : WhatsappSyncStatus.NOT_STARTED;
}

/**
 * Type guard: does `value` match a known `WhatsappMessageDirection` member?
 */
export function isValidMessageDirection(value: string): value is WhatsappMessageDirection {
  return (Object.values(WhatsappMessageDirection) as string[]).includes(value);
}

/**
 * Coerce a raw `direction` enum column value into a `WhatsappMessageDirection`
 * member. Unknown values fall back to `INBOUND` so malformed rows stay
 * renderable in the inbox.
 */
export function coerceMessageDirection(raw: string): WhatsappMessageDirection {
  return isValidMessageDirection(raw) ? raw : WhatsappMessageDirection.INBOUND;
}

/**
 * Type guard: does `value` match a known `WhatsappWebhookEventStatus` member?
 */
export function isValidWebhookEventStatus(value: string): value is WhatsappWebhookEventStatus {
  return (Object.values(WhatsappWebhookEventStatus) as string[]).includes(value);
}

/**
 * Coerce a raw webhook-event `status` column value into a
 * `WhatsappWebhookEventStatus` member. Unknown values fall back to `PENDING`
 * so an unrecognized row re-enters the durable ingest queue instead of
 * vanishing.
 */
export function coerceWebhookEventStatus(raw: string): WhatsappWebhookEventStatus {
  return isValidWebhookEventStatus(raw) ? raw : WhatsappWebhookEventStatus.PENDING;
}

/**
 * Type guard: does `value` match a known `WhatsappSyncRequestStatus` member?
 */
export function isValidSyncRequestStatus(value: string): value is WhatsappSyncRequestStatus {
  return (Object.values(WhatsappSyncRequestStatus) as string[]).includes(value);
}

/**
 * Coerce a raw sync-request `status` column value into a
 * `WhatsappSyncRequestStatus` member. Unknown values fall back to `PENDING`
 * (least-progress state; terminal states are never paved over silently).
 */
export function coerceSyncRequestStatus(raw: string): WhatsappSyncRequestStatus {
  return isValidSyncRequestStatus(raw) ? raw : WhatsappSyncRequestStatus.PENDING;
}

/**
 * Type guard: does `value` match a known `WhatsappSyncType` member?
 */
export function isValidSyncType(value: string): value is WhatsappSyncType {
  return (Object.values(WhatsappSyncType) as string[]).includes(value);
}

/**
 * Coerce a raw `sync_type` enum column value into a `WhatsappSyncType`
 * member. Unknown values fall back to `SMB_APP_STATE_SYNC`.
 */
export function coerceSyncType(raw: string): WhatsappSyncType {
  return isValidSyncType(raw) ? raw : WhatsappSyncType.SMB_APP_STATE_SYNC;
}

/**
 * Build a `WhatsappAccountReturnType` from the base fields, applying enum coercion.
 * Shared between the repository's `toReturnType` and the service's `syncFromMeta`
 * so both layers use identical coercion logic without duplication.
 */
export function buildReturnType(
  base: Omit<
    WhatsappAccountSelectType,
    "encryptedAccessToken" | "encryptedTwoStepPin" | "qualityRating" | "portfolioMessagingLimitTier"
  >,
  qualityRating: string | null,
  portfolioMessagingLimitTier: string | null
): WhatsappAccountReturnType {
  return {
    ...base,
    qualityRating: coerceQualityRating(qualityRating),
    portfolioMessagingLimitTier: coerceLimitTier(portfolioMessagingLimitTier),
    // Enum columns infer as plain strings via createEnum; coerce at the boundary.
    purpose: coerceAccountPurpose(base.purpose),
    onboardingMode: coerceOnboardingMode(base.onboardingMode),
    syncStatus: coerceSyncStatus(base.syncStatus),
  };
}

/**
 * Narrow an `unknown` jsonb payload (message `content`, webhook-event
 * `payload`) to a plain record; non-object values yield `{}`.
 */
export function coerceJsonRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }
  const record: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    record[key] = nested;
  }
  return record;
}
