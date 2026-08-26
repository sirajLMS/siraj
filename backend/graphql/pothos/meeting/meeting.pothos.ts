import type { PothosObjectFieldBuilder, PothosInputFieldBuilder } from "@/backend/graphql/pothos/shared/builder-types";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { logger } from "@/backend/lib/logger";
import { MeetingConfigService } from "@/backend/services/meeting/meeting-config.service";
import type {
  ClassMeetingConfigReturnType,
  GenerateMeetingUrlResult,
  MeetingConfigDetails,
  MeetingProviderFieldSchema,
  MeetingProviderFieldSchemaInput,
  MeetingProviderSelectType,
  UserMeetingConfigReturnType,
} from "@/backend/types";

// Extract the actual SchemaTypes from the builder instance

export type MeetingConfigBaseShape = Pick<
  ClassMeetingConfigReturnType,
  "providerId" | "provider" | "details" | "hasSecret" | "providerMetadata" | "createdAt" | "updatedAt"
>;

export const MeetingProviderFieldSchemaRef =
  gqlSchemaBuilder.objectRef<MeetingProviderFieldSchema>("MeetingProviderFieldSchema");

export const MeetingProviderFieldSchemaPothosObject = MeetingProviderFieldSchemaRef.implement({
  fields: t => ({
    requiresMeetingUrl: t.exposeBoolean("requiresMeetingUrl"),
    supportsAutoGeneration: t.exposeBoolean("supportsAutoGeneration", { nullable: true }),
    supportsUsername: t.exposeBoolean("supportsUsername", { nullable: true }),
    supportsPassword: t.exposeBoolean("supportsPassword", { nullable: true }),
    supportsTenantId: t.exposeBoolean("supportsTenantId", { nullable: true }),
  }),
});

export const MeetingProviderRef = gqlSchemaBuilder.objectRef<MeetingProviderSelectType>("MeetingProvider");

export const MeetingProviderPothosObject = MeetingProviderRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    slug: t.exposeString("slug"),
    name: t.expose("name", { type: "LocalizedString" }),
    description: t.expose("description", { type: "LocalizedString", nullable: true }),
    instructions: t.expose("instructions", { type: "LocalizedString", nullable: true }),
    urlAllowlist: t.stringList({ resolve: parent => [...parent.urlAllowlist] }),
    urlExample: t.exposeString("urlExample", { nullable: true }),
    logoUrl: t.exposeString("logoUrl", { nullable: true }),
    fieldSchema: t.field({ type: MeetingProviderFieldSchemaPothosObject, resolve: parent => parent.fieldSchema }),
    providerKind: t.exposeString("providerKind"),
    isActive: t.exposeBoolean("isActive"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

export const MeetingConfigDetailsRef = gqlSchemaBuilder.objectRef<MeetingConfigDetails>("MeetingConfigDetails");

export const MeetingConfigDetailsPothosObject = MeetingConfigDetailsRef.implement({
  fields: t => ({
    id: t.string({ resolve: () => "meeting-config-details" }),
    meetingUrl: t.exposeString("meetingUrl", { nullable: true }),
    username: t.exposeString("username", { nullable: true }),
    tenantId: t.exposeString("tenantId", { nullable: true }),
  }),
});

export function meetingConfigSharedFields(t: PothosObjectFieldBuilder<MeetingConfigBaseShape>) {
  return {
    details: t.field({ type: MeetingConfigDetailsPothosObject, resolve: parent => parent.details }),
    hasSecret: t.exposeBoolean("hasSecret", { nullable: true }),
    providerMetadata: t.field({
      type: "JSON",
      nullable: true,
      resolve: parent => parent.providerMetadata ?? null,
    }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
    provider: t.expose("provider", { type: MeetingProviderPothosObject, nullable: true }),
    meetingUrlStatus: t.field({
      type: "String",
      nullable: true,
      resolve: () => null,
    }),
    meetingUrlExpiresAt: t.field({
      type: "DateTime",
      nullable: true,
      resolve: () => null,
    }),
    meetingUrlError: t.field({
      type: "String",
      nullable: true,
      resolve: () => null,
    }),
  };
}

export const UserMeetingConfigRef = gqlSchemaBuilder.objectRef<UserMeetingConfigReturnType>("UserMeetingConfig");

export const UserMeetingConfigPothosObject = UserMeetingConfigRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    userId: t.exposeString("userId"),
    providerId: t.exposeString("providerId"),
    label: t.exposeString("label", { nullable: true }),
    isDefault: t.exposeBoolean("isDefault"),
    oauthTokenExpiresAt: t.field({
      type: "DateTime",
      nullable: true,
      resolve: async parent => {
        if (!parent.provider?.slug) return null;
        try {
          return await MeetingConfigService.getOAuthTokenExpiresAt(parent.userId, parent.provider.slug);
        } catch (error) {
          logger.error("Failed to resolve oauthTokenExpiresAt", { error });
          return null;
        }
      },
    }),
    ...meetingConfigSharedFields(t),
  }),
});

export const MeetingProviderFieldSchemaInputRef = gqlSchemaBuilder.inputRef<MeetingProviderFieldSchemaInput>(
  "MeetingProviderFieldSchemaInput"
);

export const MeetingProviderFieldSchemaInputPothos = MeetingProviderFieldSchemaInputRef.implement({
  fields: t => ({
    requiresMeetingUrl: t.boolean({ required: true }),
    supportsAutoGeneration: t.boolean({ required: false }),
    supportsUsername: t.boolean({ required: false }),
    supportsPassword: t.boolean({ required: false }),
    supportsTenantId: t.boolean({ required: false }),
  }),
});

export const MeetingConfigDetailsInputRef =
  gqlSchemaBuilder.inputRef<MeetingConfigDetails>("MeetingConfigDetailsInput");

export const MeetingConfigDetailsInputPothos = MeetingConfigDetailsInputRef.implement({
  fields: t => ({
    meetingUrl: t.string({ required: false, directives: { constraint: { maxLength: 2048 } } }),
    username: t.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
    tenantId: t.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
  }),
});

export function meetingProviderInputCommonFields(t: PothosInputFieldBuilder, required: boolean) {
  return {
    slug: t.string({ required, directives: { constraint: { maxLength: 100 } } }),
    name: t.field({ type: "LocalizedString", required }),
    description: t.field({ type: "LocalizedString", required: false }),
    instructions: t.field({ type: "LocalizedString", required: false }),
    urlAllowlist: t.stringList({ required, directives: { constraint: { maxItems: 50, maxLength: 2048 } } }),
    urlExample: t.string({ required: false, directives: { constraint: { maxLength: 2048 } } }),
    logoUrl: t.string({ required: false, directives: { constraint: { maxLength: 2048 } } }),
    fieldSchema: t.field({ type: MeetingProviderFieldSchemaInputPothos, required }),
    providerKind: t.string({ required: false, directives: { constraint: { maxLength: 50 } } }),
    isActive: t.boolean({ required: false }),
  };
}

export function meetingConfigDetailsInputCommonFields(t: PothosInputFieldBuilder, required: boolean) {
  return {
    password: t.string({ required: false, directives: { constraint: { maxLength: 500 } } }),
    details: t.field({ type: MeetingConfigDetailsInputPothos, required }),
  };
}

export function meetingConfigLabelInputCommonFields(t: PothosInputFieldBuilder, required: boolean) {
  return {
    providerId: t.string({ required }),
    label: t.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
    isDefault: t.boolean({ required }),
    ...meetingConfigDetailsInputCommonFields(t, required),
  };
}

export const MeetingProviderCreateInputPothos = gqlSchemaBuilder.inputType("MeetingProviderCreateInput", {
  fields: t => meetingProviderInputCommonFields(t, true),
});

export const MeetingProviderUpdateInputPothos = gqlSchemaBuilder.inputType("MeetingProviderUpdateInput", {
  fields: t => meetingProviderInputCommonFields(t, false),
});

export const UserMeetingConfigCreateInputPothos = gqlSchemaBuilder.inputType("UserMeetingConfigCreateInput", {
  fields: t => ({
    userId: t.string({ required: true, directives: { constraint: { maxLength: 100 } } }),
    ...meetingConfigLabelInputCommonFields(t, true),
  }),
});

export const UserMeetingConfigUpdateInputPothos = gqlSchemaBuilder.inputType("UserMeetingConfigUpdateInput", {
  fields: t => ({
    ...meetingConfigLabelInputCommonFields(t, false),
    forceRegenerate: t.boolean({ required: false }),
  }),
});

export const ClassMeetingConfigRef = gqlSchemaBuilder.objectRef<ClassMeetingConfigReturnType>("ClassMeetingConfig");

export const ClassMeetingConfigPothosObject = ClassMeetingConfigRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    classInstanceId: t.exposeString("classInstanceId", { nullable: true }),
    recurringScheduleId: t.exposeString("recurringScheduleId", { nullable: true }),
    providerId: t.exposeString("providerId"),
    label: t.exposeString("label", { nullable: true }),
    isDefault: t.exposeBoolean("isDefault"),
    ...meetingConfigSharedFields(t),
  }),
});

export const ClassMeetingConfigCreateInputPothos = gqlSchemaBuilder.inputType("ClassMeetingConfigCreateInput", {
  fields: t => ({
    classInstanceId: t.string({ required: false, directives: { constraint: { maxLength: 100 } } }),
    recurringScheduleId: t.string({ required: false, directives: { constraint: { maxLength: 100 } } }),
    ...meetingConfigLabelInputCommonFields(t, true),
  }),
});

export const ClassMeetingConfigUpdateInputPothos = gqlSchemaBuilder.inputType("ClassMeetingConfigUpdateInput", {
  fields: t => ({
    label: t.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
    isDefault: t.boolean({ required: false }),
    ...meetingConfigDetailsInputCommonFields(t, false),
    providerId: t.string({ required: false, directives: { constraint: { maxLength: 100 } } }),
  }),
});

// ============================================================================
// Generate Meeting URL — preview path (non-persisting)
// ============================================================================

export const GenerateMeetingUrlInputPothos = gqlSchemaBuilder.inputType("GenerateMeetingUrlInput", {
  fields: t => ({
    providerId: t.string({ required: true, directives: { constraint: { maxLength: 100 } } }),
    topic: t.string({ required: true, directives: { constraint: { maxLength: 200 } } }),
    startDateTime: t.string({ required: false, directives: { constraint: { maxLength: 50 } } }),
    durationMinutes: t.int({ required: false, directives: { constraint: { min: 1, max: 1440 } } }),
  }),
});

export const GenerateMeetingUrlResultRef =
  gqlSchemaBuilder.objectRef<GenerateMeetingUrlResult>("GenerateMeetingUrlResult");

export const GenerateMeetingUrlResultPothosObject = GenerateMeetingUrlResultRef.implement({
  fields: t => ({
    joinUrl: t.exposeString("joinUrl"),
    meetingId: t.exposeString("meetingId", { nullable: true }),
    expiresAt: t.exposeString("expiresAt", { nullable: true }),
  }),
});
