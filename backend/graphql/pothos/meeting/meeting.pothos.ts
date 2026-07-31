import type { InputFieldBuilder, ObjectFieldBuilder } from "@pothos/core";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import type {
  ClassMeetingConfigReturnType,
  MeetingConfigDetails,
  MeetingProviderFieldSchema,
  MeetingProviderFieldSchemaInput,
  MeetingProviderSelectType,
  UserMeetingConfigReturnType,
} from "@/backend/types";

// Extract the actual SchemaTypes from the builder instance
type BuilderTypes = typeof gqlSchemaBuilder extends { $inferSchemaTypes: infer T } ? T : never;
type PothosObjectFieldBuilder<ParentShape> = ObjectFieldBuilder<BuilderTypes, ParentShape>;
type PothosInputFieldBuilder = InputFieldBuilder<BuilderTypes, "InputObject">;

interface MeetingConfigBaseShape {
  providerId: string;
  provider?: MeetingProviderSelectType | null;
  details: MeetingConfigDetails;
  hasSecret?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MeetingProviderFieldSchemaRef =
  gqlSchemaBuilder.objectRef<MeetingProviderFieldSchema>("MeetingProviderFieldSchema");

export const MeetingProviderFieldSchemaPothosObject = MeetingProviderFieldSchemaRef.implement({
  fields: t => ({
    requiresMeetingUrl: t.exposeBoolean("requiresMeetingUrl"),
    supportsUsername: t.exposeBoolean("supportsUsername", { nullable: true }),
    supportsPassword: t.exposeBoolean("supportsPassword", { nullable: true }),
    supportsTenantId: t.exposeBoolean("supportsTenantId", { nullable: true }),
  }),
});

const MeetingProviderRef = gqlSchemaBuilder.objectRef<MeetingProviderSelectType>("MeetingProvider");

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
    isActive: t.exposeBoolean("isActive"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

const MeetingConfigDetailsRef = gqlSchemaBuilder.objectRef<MeetingConfigDetails>("MeetingConfigDetails");

export const MeetingConfigDetailsPothosObject = MeetingConfigDetailsRef.implement({
  fields: t => ({
    meetingUrl: t.exposeString("meetingUrl"),
    username: t.exposeString("username", { nullable: true }),
    tenantId: t.exposeString("tenantId", { nullable: true }),
  }),
});

function meetingConfigSharedFields(t: PothosObjectFieldBuilder<MeetingConfigBaseShape>) {
  return {
    details: t.field({ type: MeetingConfigDetailsPothosObject, resolve: parent => parent.details }),
    hasSecret: t.exposeBoolean("hasSecret", { nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
    provider: t.expose("provider", { type: MeetingProviderPothosObject, nullable: true }),
  };
}

const UserMeetingConfigRef = gqlSchemaBuilder.objectRef<UserMeetingConfigReturnType>("UserMeetingConfig");

export const UserMeetingConfigPothosObject = UserMeetingConfigRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    userId: t.exposeString("userId"),
    providerId: t.exposeString("providerId"),
    label: t.exposeString("label", { nullable: true }),
    isDefault: t.exposeBoolean("isDefault"),
    ...meetingConfigSharedFields(t),
  }),
});

const MeetingProviderFieldSchemaInputRef = gqlSchemaBuilder.inputRef<MeetingProviderFieldSchemaInput>(
  "MeetingProviderFieldSchemaInput"
);

export const MeetingProviderFieldSchemaInputPothos = MeetingProviderFieldSchemaInputRef.implement({
  fields: t => ({
    requiresMeetingUrl: t.boolean({ required: true }),
    supportsUsername: t.boolean({ required: false }),
    supportsPassword: t.boolean({ required: false }),
    supportsTenantId: t.boolean({ required: false }),
  }),
});

const MeetingConfigDetailsInputRef = gqlSchemaBuilder.inputRef<MeetingConfigDetails>("MeetingConfigDetailsInput");

export const MeetingConfigDetailsInputPothos = MeetingConfigDetailsInputRef.implement({
  fields: t => ({
    meetingUrl: t.string({ required: true }),
    username: t.string({ required: false }),
    tenantId: t.string({ required: false }),
  }),
});

function meetingProviderInputCommonFields(t: PothosInputFieldBuilder, required: boolean) {
  return {
    slug: t.string({ required }),
    name: t.field({ type: "LocalizedString", required }),
    description: t.field({ type: "LocalizedString", required: false }),
    instructions: t.field({ type: "LocalizedString", required: false }),
    urlAllowlist: t.stringList({ required }),
    urlExample: t.string({ required: false }),
    logoUrl: t.string({ required: false }),
    fieldSchema: t.field({ type: MeetingProviderFieldSchemaInputPothos, required }),
    isActive: t.boolean({ required: false }),
  };
}

function meetingConfigDetailsInputCommonFields(t: PothosInputFieldBuilder, required: boolean) {
  return {
    password: t.string({ required: false }),
    details: t.field({ type: MeetingConfigDetailsInputPothos, required }),
  };
}

function meetingConfigLabelInputCommonFields(t: PothosInputFieldBuilder, required: boolean) {
  return {
    providerId: t.string({ required }),
    label: t.string({ required: false }),
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
    userId: t.string({ required: true }),
    ...meetingConfigLabelInputCommonFields(t, true),
  }),
});

export const UserMeetingConfigUpdateInputPothos = gqlSchemaBuilder.inputType("UserMeetingConfigUpdateInput", {
  fields: t => meetingConfigLabelInputCommonFields(t, false),
});

const ClassMeetingConfigRef = gqlSchemaBuilder.objectRef<ClassMeetingConfigReturnType>("ClassMeetingConfig");

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
    classInstanceId: t.string({ required: false }),
    recurringScheduleId: t.string({ required: false }),
    ...meetingConfigLabelInputCommonFields(t, true),
  }),
});

export const ClassMeetingConfigUpdateInputPothos = gqlSchemaBuilder.inputType("ClassMeetingConfigUpdateInput", {
  fields: t => ({
    label: t.string({ required: false }),
    isDefault: t.boolean({ required: false }),
    ...meetingConfigDetailsInputCommonFields(t, false),
    providerId: t.string({ required: false }),
  }),
});
