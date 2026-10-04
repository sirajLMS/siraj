import {
  WhatsappAccountPurpose,
  WhatsappConversationSendMode,
  WhatsappGroupJoinApprovalMode,
  WhatsappLimitTier,
  WhatsappMessageDirection,
  WhatsappOnboardingMode,
  WhatsappQualityRating,
  WhatsappSyncRequestStatus,
  WhatsappSyncStatus,
  WhatsappSyncType,
  WhatsappTemplateCategory,
  WhatsappTemplateStatus,
  WhatsappTestRecipientStatus,
  WhatsappTokenTestFailureKind,
  WhatsappWebhookEventStatus,
} from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";

export const WhatsappQualityRatingPothosEnum = gqlSchemaBuilder.enumType(WhatsappQualityRating, {
  name: "WhatsappQualityRating",
});

export const WhatsappLimitTierPothosEnum = gqlSchemaBuilder.enumType(WhatsappLimitTier, {
  name: "WhatsappLimitTier",
});

export const WhatsappTemplateStatusPothosEnum = gqlSchemaBuilder.enumType(WhatsappTemplateStatus, {
  name: "WhatsappTemplateStatus",
});

export const WhatsappTemplateCategoryPothosEnum = gqlSchemaBuilder.enumType(WhatsappTemplateCategory, {
  name: "WhatsappTemplateCategory",
});

export const WhatsappAccountPurposePothosEnum = gqlSchemaBuilder.enumType(WhatsappAccountPurpose, {
  name: "WhatsappAccountPurpose",
});

export const WhatsappTokenTestFailureKindPothosEnum = gqlSchemaBuilder.enumType(WhatsappTokenTestFailureKind, {
  name: "WhatsappTokenTestFailureKind",
});

export const WhatsappOnboardingModePothosEnum = gqlSchemaBuilder.enumType(WhatsappOnboardingMode, {
  name: "WhatsappOnboardingMode",
});

export const WhatsappSyncStatusPothosEnum = gqlSchemaBuilder.enumType(WhatsappSyncStatus, {
  name: "WhatsappSyncStatus",
});

export const WhatsappMessageDirectionPothosEnum = gqlSchemaBuilder.enumType(WhatsappMessageDirection, {
  name: "WhatsappMessageDirection",
});

export const WhatsappWebhookEventStatusPothosEnum = gqlSchemaBuilder.enumType(WhatsappWebhookEventStatus, {
  name: "WhatsappWebhookEventStatus",
});

export const WhatsappSyncRequestStatusPothosEnum = gqlSchemaBuilder.enumType(WhatsappSyncRequestStatus, {
  name: "WhatsappSyncRequestStatus",
});

export const WhatsappSyncTypePothosEnum = gqlSchemaBuilder.enumType(WhatsappSyncType, {
  name: "WhatsappSyncType",
});

export const WhatsappTestRecipientStatusPothosEnum = gqlSchemaBuilder.enumType(WhatsappTestRecipientStatus, {
  name: "WhatsappTestRecipientStatus",
});

export const WhatsappConversationSendModePothosEnum = gqlSchemaBuilder.enumType(WhatsappConversationSendMode, {
  name: "WhatsappConversationSendMode",
});

export const WhatsappGroupJoinApprovalModePothosEnum = gqlSchemaBuilder.enumType(WhatsappGroupJoinApprovalMode, {
  name: "WhatsappGroupJoinApprovalMode",
});
