import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  WhatsappLimitTierPothosEnum,
  WhatsappQualityRatingPothosEnum,
  WhatsappTemplateCategoryPothosEnum,
  WhatsappTemplateStatusPothosEnum,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import { whatsappAccountSharedInputFields } from "@/backend/graphql/pothos/whatsapp/__shared__/whatsappAccountFieldHelpers";
import type {
  WhatsappAccountReturnType,
  WhatsappSyncFromMetaReturnType,
  WhatsappTemplateSnapshot,
} from "@/backend/types";

// ─── Object Types ─────────────────────────────────────────────────────────────

const WhatsappAccountRef = gqlSchemaBuilder.objectRef<WhatsappAccountReturnType>("WhatsappAccount");

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
// String lengths are not enforced at the GraphQL layer (Pothos does not
// support maxLength natively); see service-layer validation for bounds.
export const WhatsappAccountCreateInputPothosObject = gqlSchemaBuilder.inputType("WhatsappAccountCreateInput", {
  fields: t => ({
    wabaId: t.string({ required: true, description: "WhatsApp Business Account ID (max 64 chars)" }),
    phoneNumberId: t.string({ required: true, description: "Phone number ID (max 64 chars)" }),
    ...whatsappAccountSharedInputFields(t),
  }),
});

export const WhatsappAccountUpdateInputPothosObject = gqlSchemaBuilder.inputType("WhatsappAccountUpdateInput", {
  fields: t => whatsappAccountSharedInputFields(t),
});

// ─── Sync Result Types (BL3) ──────────────────────────────────────────────────
// WhatsappTemplateSnapshot and WhatsappSyncFromMetaReturnType are defined
// in @/backend/types/whatsapp/whatsapp-account.types.ts (REQ-8.1 — no local type defs in Pothos).

const WhatsappTemplateSnapshotRef = gqlSchemaBuilder.objectRef<WhatsappTemplateSnapshot>("WhatsappTemplateSnapshot");

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

const WhatsappSyncFromMetaResultRef =
  gqlSchemaBuilder.objectRef<WhatsappSyncFromMetaReturnType>("WhatsappSyncFromMetaResult");

export const WhatsappSyncFromMetaResultPothosObject = WhatsappSyncFromMetaResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    accounts: t.expose("accounts", { type: [WhatsappAccountPothosObject] }),
    templates: t.expose("templates", { type: [WhatsappTemplateSnapshotPothosObject] }),
  }),
});
