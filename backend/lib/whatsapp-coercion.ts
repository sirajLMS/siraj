import { WhatsappLimitTier, WhatsappQualityRating } from "@/backend/enum/whatsapp/whatsapp.enum";
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
  };
}
