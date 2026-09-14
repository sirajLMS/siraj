import type { PothosInputFieldBuilder } from "@/backend/graphql/pothos/shared/builder-types";
import {
  WhatsappLimitTierPothosEnum,
  WhatsappQualityRatingPothosEnum,
} from "@/backend/graphql/pothos/shared/enum.pothos";

/**
 * Shared input field definitions for WhatsApp account create/update inputs.
 * Excludes `wabaId` and `phoneNumberId` (Create-only, required).
 */
export function whatsappAccountSharedInputFields(t: PothosInputFieldBuilder) {
  return {
    displayPhoneNumber: t.string({
      required: false,
      description: "Display phone number (max 32 chars)",
      directives: { constraint: { maxLength: 32 } },
    }),
    displayName: t.field({ type: "LocalizedString", required: false }),
    qualityRating: t.field({ type: WhatsappQualityRatingPothosEnum, required: false }),
    portfolioMessagingLimitTier: t.field({ type: WhatsappLimitTierPothosEnum, required: false }),
    throughputLevel: t.string({ required: false, directives: { constraint: { maxLength: 32 } } }),
    isActive: t.boolean({ required: false }),
  };
}
