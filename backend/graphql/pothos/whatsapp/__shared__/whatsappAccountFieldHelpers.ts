import type { InputFieldBuilder } from "@pothos/core";
import type { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  WhatsappLimitTierPothosEnum,
  WhatsappQualityRatingPothosEnum,
} from "@/backend/graphql/pothos/shared/enum.pothos";

type BuilderTypes = typeof gqlSchemaBuilder extends { $inferSchemaTypes: infer T } ? T : never;
type PothosInputFieldBuilder = InputFieldBuilder<BuilderTypes, "InputObject">;

/**
 * Shared input field definitions for WhatsApp account create/update inputs.
 * Excludes `wabaId` and `phoneNumberId` (Create-only, required).
 */
export function whatsappAccountSharedInputFields(t: PothosInputFieldBuilder) {
  return {
    displayPhoneNumber: t.string({ required: false, description: "Display phone number (max 32 chars)" }),
    displayName: t.field({ type: "LocalizedString", required: false }),
    qualityRating: t.field({ type: WhatsappQualityRatingPothosEnum, required: false }),
    portfolioMessagingLimitTier: t.field({ type: WhatsappLimitTierPothosEnum, required: false }),
    throughputLevel: t.string({ required: false }),
    isActive: t.boolean({ required: false }),
  };
}
