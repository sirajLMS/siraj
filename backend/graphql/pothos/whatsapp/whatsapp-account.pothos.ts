import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  WhatsappAccountPurposePothosEnum,
  WhatsappLimitTierPothosEnum,
  WhatsappOnboardingModePothosEnum,
  WhatsappQualityRatingPothosEnum,
  WhatsappSyncStatusPothosEnum,
  WhatsappTemplateCategoryPothosEnum,
  WhatsappTemplateStatusPothosEnum,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import { whatsappAccountSharedInputFields } from "@/backend/graphql/pothos/whatsapp/__shared__/whatsappAccountFieldHelpers";
import type {
  WhatsappAccessTokenTestResultType,
  WhatsappAccountReturnType,
  WhatsappConfigurationStatusType,
  WhatsappSyncFromMetaReturnType,
  WhatsappTemplateSnapshot,
} from "@/backend/types";

// ─── Object Types ─────────────────────────────────────────────────────────────

export const WhatsappAccountRef = gqlSchemaBuilder.objectRef<WhatsappAccountReturnType>("WhatsappAccount");

export const WhatsappAccountPothosObject = WhatsappAccountRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    wabaId: t.exposeString("wabaId"),
    phoneNumberId: t.exposeString("phoneNumberId"),
    displayPhoneNumber: t.exposeString("displayPhoneNumber", { nullable: true }),
    displayName: t.expose("displayName", { type: "LocalizedString", nullable: true }),
    qualityRating: t.expose("qualityRating", { type: WhatsappQualityRatingPothosEnum, nullable: true }),
    portfolioMessagingLimitTier: t.expose("portfolioMessagingLimitTier", {
      type: WhatsappLimitTierPothosEnum,
      nullable: true,
    }),
    throughputLevel: t.exposeString("throughputLevel", { nullable: true }),
    maxPhoneNumbersPerBusiness: t.exposeString("maxPhoneNumbersPerBusiness", { nullable: true }),
    isActive: t.exposeBoolean("isActive"),
    purpose: t.expose("purpose", { type: WhatsappAccountPurposePothosEnum }),
    onboardingMode: t.expose("onboardingMode", { type: WhatsappOnboardingModePothosEnum }),
    syncStatus: t.expose("syncStatus", { type: WhatsappSyncStatusPothosEnum }),
    syncPhase: t.exposeInt("syncPhase", { nullable: true }),
    syncProgress: t.exposeInt("syncProgress"),
    syncDeadlineAt: t.expose("syncDeadlineAt", { type: "DateTime", nullable: true }),
    syncFailureReason: t.exposeString("syncFailureReason", { nullable: true }),
    lastWebhookAt: t.expose("lastWebhookAt", { type: "DateTime", nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

// ─── Input Types ──────────────────────────────────────────────────────────────
//
// Note: `encryptedAccessToken` and `encryptedTwoStepPin` are intentionally
// excluded from create/update inputs — credential updates go through the
// dedicated `setWhatsappAccessToken` / `setWhatsappTwoStepPin` mutations.
export const WhatsappAccountCreateInputPothosObject = gqlSchemaBuilder.inputType("WhatsappAccountCreateInput", {
  fields: t => ({
    wabaId: t.string({
      required: true,
      description: "WhatsApp Business Account ID (max 64 chars)",
      directives: { constraint: { maxLength: 64 } },
    }),
    phoneNumberId: t.string({
      required: true,
      description: "Phone number ID (max 64 chars)",
      directives: { constraint: { maxLength: 64 } },
    }),
    purpose: t.field({
      type: WhatsappAccountPurposePothosEnum,
      required: false,
      description:
        "Initial routing purpose (defaults to GENERAL). Reassignment on existing accounts goes through updateWhatsappAccountPurpose.",
    }),
    ...whatsappAccountSharedInputFields(t),
  }),
});

export const WhatsappAccountUpdateInputPothosObject = gqlSchemaBuilder.inputType("WhatsappAccountUpdateInput", {
  fields: t => whatsappAccountSharedInputFields(t),
});

/**
 * Embedded Signup (coexistence) completion input. The `code` is the
 * single-use authorization code captured by the FB.login session listener;
 * `wabaId` is always present, `phoneNumberId`/`businessId` are optional
 * session-logger assets. The ES `config_id` is never client input — the
 * server resolves it from env-config.
 */
export const WhatsappEmbeddedSignupInputPothosObject = gqlSchemaBuilder.inputType("WhatsappEmbeddedSignupInput", {
  fields: t => ({
    code: t.string({
      required: true,
      description: "Single-use ES authorization code (max 2048 chars)",
      directives: { constraint: { maxLength: 2048 } },
    }),
    wabaId: t.string({
      required: true,
      description: "WhatsApp Business Account ID from the session event (max 64 chars)",
      directives: { constraint: { maxLength: 64 } },
    }),
    phoneNumberId: t.string({
      required: false,
      description: "Phone number ID when the session event carried it (max 64 chars)",
      directives: { constraint: { maxLength: 64 } },
    }),
    businessId: t.string({
      required: false,
      description: "Meta Business ID from the session event (max 64 chars)",
      directives: { constraint: { maxLength: 64 } },
    }),
  }),
});

// ─── Sync Result Types (BL3) ──────────────────────────────────────────────────
// WhatsappTemplateSnapshot and WhatsappSyncFromMetaReturnType are defined
// in @/backend/types/whatsapp/whatsapp-account.types.ts (REQ-8.1 — no local type defs in Pothos).

export const WhatsappTemplateSnapshotRef =
  gqlSchemaBuilder.objectRef<WhatsappTemplateSnapshot>("WhatsappTemplateSnapshot");

export const WhatsappTemplateSnapshotPothosObject = WhatsappTemplateSnapshotRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    language: t.exposeString("language"),
    status: t.expose("status", { type: WhatsappTemplateStatusPothosEnum, nullable: true }),
    category: t.expose("category", { type: WhatsappTemplateCategoryPothosEnum, nullable: true }),
    lastSyncedAt: t.expose("lastSyncedAt", { type: "DateTime", nullable: true }),
  }),
});

export const WhatsappSyncFromMetaResultRef =
  gqlSchemaBuilder.objectRef<WhatsappSyncFromMetaReturnType>("WhatsappSyncFromMetaResult");

export const WhatsappSyncFromMetaResultPothosObject = WhatsappSyncFromMetaResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    accounts: t.expose("accounts", { type: [WhatsappAccountPothosObject] }),
    templates: t.expose("templates", { type: [WhatsappTemplateSnapshotPothosObject] }),
  }),
});

export const WhatsappConfigurationStatusRef =
  gqlSchemaBuilder.objectRef<WhatsappConfigurationStatusType>("WhatsappConfigurationStatus");

export const WhatsappConfigurationStatusPothosObject = WhatsappConfigurationStatusRef.implement({
  fields: t => ({
    isConfigured: t.exposeBoolean("isConfigured", { nullable: false }),
    envBootstrapAvailable: t.exposeBoolean("envBootstrapAvailable", { nullable: false }),
    missingEnvKeys: t.exposeStringList("missingEnvKeys", { nullable: false }),
  }),
});

export const WhatsappAccessTokenTestResultRef = gqlSchemaBuilder.objectRef<WhatsappAccessTokenTestResultType>(
  "WhatsappAccessTokenTestResult"
);

export const WhatsappAccessTokenTestResultPothosObject = WhatsappAccessTokenTestResultRef.implement({
  fields: t => ({
    isValid: t.exposeBoolean("isValid"),
    isConnected: t.exposeBoolean("isConnected"),
    status: t.exposeString("status", { nullable: true }),
    reason: t.exposeString("reason", { nullable: true }),
  }),
});
